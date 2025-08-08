(function($) {
  /*
   * ページ内見出しナビゲーション
         */
        $.fn.stickyNavigator = function(opts) {

                // 引数に値が存在する場合、デフォルト値を上書きする
                var settings = $.extend({}, $.fn.stickyNavigator.defaults, opts);

                var self = $(this);

                if (settings.includeTOCHeight){
                        settings.adjustment = settings.adjustment + self.height();
                }

                var targets = $(settings.wrapselector).find(settings.targetselector);
                if (self.length === 0 || targets.length === 0) {
                        return;
                }

                var toclink = document.createElement('link');
                toclink.setAttribute('rel', 'stylesheet');
                toclink.setAttribute('href', baseURL + 'tdx-toc.css');
                document.head.appendChild(toclink);


                var getHeaderName = function(txt){
                        return txt.replace(/[^a-zA-Z0-9]/g, '');
                }

                var navigationMenu = [
                        '<div id="sscTOC" class="side-left collapse in"><ul>',
                        targets.map(function() {
                                var target = $(this),
                                text = target.text();
                                var headerName = getHeaderName(text);
                                this.setAttribute('name',headerName);
                                var num = Math.floor( Math.random() * 99999999 );
                                var href = 'js-nav-'+num;
                                target.addClass('js-nav');
                                target.addClass(href);
                                target.data('num', num);
                                var clazz = 'nav-'+target[0].tagName.toLowerCase();
                                clazz = clazz + ' nav-'+num;
                                return '<li class="'+clazz+'"><a href="#' + headerName + '" data-href=".'+href+'">' + $('<dummy>').text(text).html() + '</li>';
                        }).get().join(''),
                        '</ul></div>'
                ].join('');

                self.contents().first().replaceWith(navigationMenu);

                // TOC link click behavior
                /* self.find('li>a').click(function(e) {
                        var a = $(this),
                                href = a.data('href'),
                                to = $(href);
                        e.preventDefault();
                        $('html, body').animate({scrollTop: to.offset().top - settings.adjustment - 140}, 500);
                });
                */


                // 現在表示中のインデックスを見つける
                // called from the style selection (highlighting) function
                var findIndexNum = function() {
                        var scrollTop = $(window).scrollTop();
                        var num = '';
                        if (scrollTop < $('.js-nav:eq(0)').offset().top - settings.adjustment - 140) {
                                return num;
                        }
                        $('.js-nav').each(function (i) {
                                if (i === 0) {
                                        return;
                                }
                                //console.log(scrollTop);
                                //console.log($(this).offset().top);
                                if (Math.floor(scrollTop) < (Math.floor($(this).offset().top)-1 - settings.adjustment - 140)) {
                                        num = $('.js-nav:eq('+(i-1)+')').data('num');
                                        return false;
                                }
                        });
                        if (num === '') {
                                num = $('.js-nav:last').data('num');
                        }
                        return num;
                }

                // 見出しナビゲーションのカレントを選択します。
                // add the style
                var selectCurrent = function(obj) {
                        if ($(obj).scrollTop() > (self.parent().offset().top - settings.adjustment)) {
                                var num = findIndexNum();
                                self.find('li').removeClass('current');
                                self.find('li.nav-'+num).addClass('current');
                                document.querySelector('li.nav-'+num).scrollIntoView({align: false, behavior: 'smooth',});
                        }
                }

                $(window).scroll(function () {
                        selectCurrent(this);
                });
                selectCurrent(window);

                return this;
        }

        $.fn.stickyNavigator.defaults = {
                wrapselector    : document,
                targetselector  : "h2,h3",
                adjustment              : 160,
                includeTOCHeight: true
        };

})(jQuery);

// $('#ctl00_ctl00_cpContent_cpContent_divBody').prepend('<aside class="side-left"id="sticky-navigator">Table of Contents</aside>');

$('aside[data-target="sticky-navigator"]').stickyNavigator({
  // options here
  wrapselector:'#ctl00_ctl00_cpContent_cpContent_divBody',
  targetselector: "h2"
});

function setUpSSCKB (){
		var baseURL = new URL(document.currentScript.src).pathname;

        if (document.location.href.indexOf('SSC/KB/ArticleDet')>-1){

                $('.col-md-4').insertBefore( $ ("#divMainContent"));

                $('.col-md-4').stickyNavigator({
                        // options here
                        wrapselector:'#ctl00_ctl00_cpContent_cpContent_divBody',
                        targetselector: "h1,h2,h3",
                        includeTOCHeight: false,
                        adjustment: 0
                });

                $('<div id="tocChevron" data-target="#sscTOC" data-toggle="collapse"><i class="fa fa-chevron-circle-down"></i></div>').insertBefore('#sscTOC');
		var isNotLoggedIn = $('form:has(a[href*="Login.aspx"])');
		if (isNotLoggedIn.length == -1){
			// i.e. they ARE logged in
	                // $('#sscTOC').attr('class','collapse');
		}
		var isTechnician = $('form:has(.user-profile-menu a[href*="TDNext"])');
		if (isTechnician.length == 1){
			// i.e. they are a technician
			$('#sscTOC').attr('class','collapse');
		}
        }
}

setUpSSCKB();

