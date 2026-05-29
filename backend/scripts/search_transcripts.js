require('dotenv').config({path:'./.env'});
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres', logging:false });
const { Op } = require('sequelize');
(async ()=>{
  try{
    await sequelize.authenticate();
    const Transcript = require('../src/models/Transcript');
    const results = await Transcript.findAll({ where: { transcript: { [Op.iLike]: '%fallback%' } }, limit: 50 });
    console.log('Found',results.length,'records containing "fallback"');
    results.forEach((r,i)=>{ console.log(i+1, 'id:', r.id, 'len:', (r.transcript || '').length); });
    process.exit(0);
  }catch(e){
    console.error('DB ERR', e.message);
    process.exit(1);
  }
})();
