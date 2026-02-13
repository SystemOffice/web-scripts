export function pollUntil(predicate, { interval = 50, maxWait = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    const result = predicate();
    if (result) return resolve(result);

    const startTime = Date.now();

    const timer = setInterval(() => {
      const current = predicate();

      if (current) {
        clearInterval(timer);
        resolve(current);
        return;
      }

      if (Date.now() - startTime >= maxWait) {
        clearInterval(timer);
        reject(new Error(`pollUntil timed out after ${maxWait}ms`));
      }
    }, interval);
  });
}
