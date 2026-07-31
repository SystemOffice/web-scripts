// Patches styles/IS_CV_OB_STYLES_SDK.css so the #isChatWelcomeBubble
// greeting bubble reveals/hides via `transform: scaleX()` (GPU-composited)
// instead of animating `width` (which forces layout on every frame — this
// is exactly what Lighthouse's "Avoid non-composited animations" audit
// flags, and what the perf audit's fix #4 asked for).
//
// Mechanics (verified against the vendor's actual markup/CSS):
//   - #isChatWelcomeBubble's only child is a single <p id="isChatWelcomeText">
//     greeting label; there is no separate icon inside it (the persistent
//     launcher icon is a different element, `.oda-chat-button`, from
//     Oracle's own SDK) — so only that one child needs counter-scaling.
//   - The bubble already has `overflow: hidden`, so scaling it down and
//     clipping reproduces the original "shrink and clip" look.
//   - Both breakpoints' show/hide widths are made equal (the box's real
//     width no longer changes at all — only its transform does), which is
//     required: transform and width can't both be animated toward
//     different targets without a visible double-motion glitch.
//   - The bare "no class yet" state (before JS ever adds .welcomeBubbleShow
//     or .welcomeBubbleHide) is given the same collapsed transform as
//     .welcomeBubbleHide, so first paint matches original behavior exactly
//     (originally: base width 75px == hide width 75px, i.e. a no-op).
//
// Ratios: desktop show=260px/hide=75px; mobile (<=767px) effective
// show=180px/hide=50px (the 180px value already wins over a stale, more
// specific 190px value in the vendor's own CSS via cascade specificity —
// this patch preserves that outcome rather than "fixing" it).
//
// NOTE: transform-origin is set to `right center` to match the bubble's
// `float: right` (grows/shrinks from its right edge, anchored to the
// corner). This is the one part of this patch that hasn't been visually
// verified against the live, initialized widget — check it on a staging
// page before shipping.
//
// Every replacement below is matched against an EXACT, verbatim snippet of
// the vendor's current CSS. If the vendor changes any of this in a future
// sync, the matching snippet won't be found and this throws instead of
// silently applying a stale patch — that's deliberate; update the snippets
// here to match the new vendor CSS when that happens.

const REPLACEMENTS = [
    {
        label: 'base rule (desktop): fix width at 260px, add collapsed-state transform',
        from: `#isChatWelcomeBubble {
  position: relative;
  border-radius: 50px;
  color: #FFFFFF;
  background-color: #54565a;
  width: 75px;
  height: 75px;
  font-family: "PT Sans", Arial, sans-serif;
  overflow: hidden;

  /* Flex centering */
  display: flex;
  align-items: center;
  /* JDL 3/27/25 */
    float:right;
    bottom: 75px;

}`,
        to: `#isChatWelcomeBubble {
  position: relative;
  border-radius: 50px;
  color: #FFFFFF;
  background-color: #54565a;
  width: 260px;
  height: 75px;
  font-family: "PT Sans", Arial, sans-serif;
  overflow: hidden;

  /* Flex centering */
  display: flex;
  align-items: center;
  /* JDL 3/27/25 */
    float:right;
    bottom: 75px;

  /* VCCS perf patch: width fixed at the "shown" size; show/hide now
     animates via transform (GPU-composited) instead of width. */
  transform: scaleX(0.28846);
  transform-origin: right center;
}`,
    },
    {
        label: 'show/hide (desktop): animate transform instead of width, counter-scale the text',
        from: `#isChatWelcomeBubble.welcomeBubbleShow {
	width: 260px;  /* 220px */
	cursor: pointer;
	transition: width 1s ease-out 1s, opacity 0s 1s;
	opacity: 1;
}
	
#isChatWelcomeBubble.welcomeBubbleHide {
	width: 75px;
	opacity: 0;
	transition: width 1s ease-out 1s, opacity 0s;
	transition-delay: 0s, 1s;
}

body.ida-outage #isChatWelcomeBubble {
	display: none !important;
}
/* end welcome text */`,
        to: `#isChatWelcomeBubble.welcomeBubbleShow {
	cursor: pointer;
	transition: transform 1s ease-out 1s, opacity 0s 1s;
	transform: scaleX(1);
	opacity: 1;
}
	
#isChatWelcomeBubble.welcomeBubbleHide {
	transform: scaleX(0.28846);
	opacity: 0;
	transition: transform 1s ease-out 1s, opacity 0s;
	transition-delay: 0s, 1s;
}

/* VCCS perf patch: counteract the parent's scaleX() so the greeting text
   doesn't look squished while the bubble is collapsed. */
#isChatWelcomeBubble:not(.welcomeBubbleShow) #isChatWelcomeText {
	transform: scaleX(3.46667);
}

body.ida-outage #isChatWelcomeBubble {
	display: none !important;
}
/* end welcome text */`,
    },
    {
        label: 'mobile breakpoint (<=767px): same transform swap at the 180/50 ratio',
        from: `	#isChatWelcomeBubble {
		width: 50px;
		height: 50px;
		bottom: 49px;
	}

	#isChatWelcomeBubble.welcomeBubbleShow {
		/* JDL fix 2/5/26 width: 180px; */
		width:190px;
	/*	margin-right: -30px; */
		
	}

	#isChatWelcomeBubble.welcomeBubbleHide {
		width: 50px;
	}

	.isCV_PublicChat #isChatIconWrapper #isChatWelcomeBubble #isChatWelcomeText {
		font-size: 12px;
		margin: 10px 15px;
		width: 115px ;
	}
}`,
        to: `	#isChatWelcomeBubble {
		width: 180px;
		height: 50px;
		bottom: 49px;
		transform: scaleX(0.27778);
	}

	#isChatWelcomeBubble.welcomeBubbleShow {
		/* JDL fix 2/5/26 width: 180px; */
		transform: scaleX(1);
	/*	margin-right: -30px; */
		
	}

	#isChatWelcomeBubble.welcomeBubbleHide {
		transform: scaleX(0.27778);
	}

	.isCV_PublicChat #isChatIconWrapper #isChatWelcomeBubble #isChatWelcomeText {
		font-size: 12px;
		margin: 10px 15px;
		width: 115px ;
	}

	#isChatWelcomeBubble:not(.welcomeBubbleShow) #isChatWelcomeText {
		transform: scaleX(3.6);
	}
}`,
    },
    {
        label: 'mobile breakpoint: neutralize the later, higher-specificity 180px override',
        from: `body #isChatWelcomeBubble.welcomeBubbleShow {
    width: 180px;
  }
}`,
        to: `body #isChatWelcomeBubble.welcomeBubbleShow {
    transform: scaleX(1);
  }
}`,
    },
];

/**
 * applyWelcomeBubbleAnimationPatch(css)
 * Applies each REPLACEMENTS entry in order. Throws immediately, naming the
 * failed replacement, if any "from" snippet isn't found verbatim — a build
 * failure here means the vendor's CSS changed and this patch needs updating,
 * not that it's safe to skip.
 */
export function applyWelcomeBubbleAnimationPatch(css) {
    let patched = css;
    for (const { label, from, to } of REPLACEMENTS) {
        if (!patched.includes(from)) {
            throw new Error(
                `welcome-bubble-animation patch failed: could not find expected CSS for "${label}". `
                + 'The vendor likely changed styles/IS_CV_OB_STYLES_SDK.css — update patches/welcome-bubble-animation.mjs to match.',
            );
        }
        patched = patched.replace(from, to);
    }
    return patched;
}
