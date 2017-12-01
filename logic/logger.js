"use strict";

const winston = require('winston');

function new_logger(module_name){
    const { combine, timestamp, label, printf } = winston.format;

    const myFormat = printf(info => {
        return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
    });

    const logger = winston.createLogger({
        format: combine(
            label({ label: module_name }),
            timestamp(),
            myFormat
        ),
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({ filename: 'polybot.log' })
        ]
    });
    return logger;
}

module.exports.new_logger = new_logger;