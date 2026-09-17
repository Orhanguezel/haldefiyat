import {pool} from '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/src/db/client';
import {env} from '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/src/core/env';
import {getSmtpSettings} from '@agro/shared-backend/modules/siteSettings/service';
import nodemailer from 'nodemailer';
const cfg=await getSmtpSettings();
const transport=nodemailer.createTransport({host:cfg.host!,port:cfg.port||587,secure:cfg.secure??cfg.port===465,auth:cfg.username&&cfg.password?{user:cfg.username,pass:cfg.password}:undefined,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});
let smtp=false;try{smtp=await transport.verify();}catch(e){console.log(JSON.stringify({smtpError:e instanceof Error?e.message:'failed'}));}finally{transport.close()}
const [counts]=await pool.query("SELECT COUNT(*) total,SUM(description IS NULL OR TRIM(description)='') missingDescription,SUM(status='approved' AND valid_until IN (CURDATE(),DATE_ADD(CURDATE(),INTERVAL 3 DAY))) reminderCandidates FROM hf_listings");
console.log(JSON.stringify({smtpVerified:smtp,timezone:env.ETL.cronTimezone,counts}));await pool.end();
