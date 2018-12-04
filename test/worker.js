const workerFarm = require('worker-farm');
const workers = workerFarm(require.resolve('./view_precompile'));

workers('#VIEW-PRECOMPILE', (err, outp) => {
  console.log(err, outp);
  workerFarm.end(workers);
});
