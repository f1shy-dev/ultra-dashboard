// See documentation for more information 

self.__dynamic$config = {
  prefix: '/dynserv_engine/',
  encoding: 'xor',
  mode: 'production', 
  logLevel: 100000, 
  bare: {
    version: 2, 
    path: 'https://bare-server.akku1139.workers.dev/',
  },
  tab: {
    title: 'Service',
    icon: null,
    ua: null,
  },
  assets: {
    prefix: '/dynamic/',
    files: {
      handler: 'dynamic.handler.js',
      client: 'dynamic.client.js',
      worker: 'dynamic.worker.js',
      config: 'dynamic.config.js',
      inject: null,
    }
  },
  block: [
  
  ]
};
