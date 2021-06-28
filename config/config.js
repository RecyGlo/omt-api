const env = process.env.NODE_ENV || 'production';

const config = {
  development: {
    db: 'mongodb+srv://myo:oh_my_trash_testing@cluster0.zdtry.mongodb.net/ohmytrash',
    API_VERSION: 'api/v1',
    jwtSecret: '0hmytr@sh',
    refershTokenSecret: '0hMyTr@sH',
    port: 3000,
    jwtTokenLife: '1d',
    refreshTokenSecretLife: '30d',
    ONE_SIGNAL_APP_ID: '24076781-f30d-4725-9e06-d5d8aaf9563a',
    ONE_SIGNAL_REST_KEY: 'NGNjZTQ3NzEtMTdmYi00ZGEwLWEwN2MtMDNkYzAzYjY3MjVj',
    ONE_SIGNAL_USER_AUTH_KEY: 'MmRjMDNjZGItY2VjYy00MWM0LWIxMTQtODU1N2Q4M2Q2ZWVi'
  },
  production: {
    db:
      'mongodb+srv://t0e:3T+wFvAQ@cluster0-whuie.mongodb.net/ohmytrash',
    API_VERSION: 'api/v1',
    jwtSecret: '0hmytr@sh',
    refershTokenSecret: '0hMyTr@sH',
    port: 3000,
    jwtTokenLife: '1d',
    refreshTokenSecretLife: '30d',
    ONE_SIGNAL_APP_ID: '24076781-f30d-4725-9e06-d5d8aaf9563a',
    ONE_SIGNAL_REST_KEY: 'NGNjZTQ3NzEtMTdmYi00ZGEwLWEwN2MtMDNkYzAzYjY3MjVj',
    ONE_SIGNAL_USER_AUTH_KEY: 'MmRjMDNjZGItY2VjYy00MWM0LWIxMTQtODU1N2Q4M2Q2ZWVi'
  },
};

module.exports = config[env];
