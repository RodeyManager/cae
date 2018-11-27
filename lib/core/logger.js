/**
 * Appliction Logger class
 * 日志类 基于winston
 */

'use strict';

const path = require('path');
const extend = require('extend');
const {
  createLogger,
  format,
  transports
} = require('winston');
const {
  combine,
  timestamp,
  label,
  printf
} = format;


const formatter = printf(info => {
  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

function newLogger(loglabel, colorize = false, tpts) {

  const cm = colorize ? combine(
    label({
      label: loglabel
    }),
    timestamp(),
    format.colorize(),
    formatter
  ) : combine(
    label({
      label: loglabel
    }),
    timestamp(),
    formatter
  );

  const logger = createLogger({
    format: cm,
    tpts
  });
  return logger;
}

exports.appLogger = (app) => {
  const logConfig = app.config.get('log') || {};
  const appLog = logConfig.appLog || {};
  const logPath = appLog.path ? (path.isAbsolute(appLog.path) ? appLog.path : path.resolve(app.root, appLog.path)) : path.resolve(app.root, 'logs');
  return newLogger(appLog.label || 'App Log', true, extend(true, {
    transports: [
      new transports.Console(),
      new transports.File({
        filename: path.resolve(logPath, 'app.log'),
        level: 'info'
      }),
      new transports.File({
        filename: path.resolve(logPath, 'error.log'),
        level: 'error'
      }),
    ],
  }, appLog));
};


exports.ctxLogger = (app, ctx, next) => {
  const logConfig = app.config.get('log') || {};
  const ctxLog = logConfig.ctxLog || {};
  const logPath = ctxLog.path ? (path.isAbsolute(ctxLog.path) ? ctxLog.path : path.resolve(app.root, ctxLog.path)) : path.resolve(app.root, 'logs');
  return newLogger(ctxLog.label || '', false, extend(true, {
    transports: [
      new transports.File({
        path: logPath,
        filename: path.resolve(logPath, 'context.log'),
      }),
      new transports.File({
        path: logPath,
        filename: path.resolve(logPath, 'error.log'),
        level: 'error'
      })
    ],
  }, ctxLog));
};

exports.dbLogger = (db) => {

};