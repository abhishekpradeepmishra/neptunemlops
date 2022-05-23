const AWS = require('aws-sdk');
const stepfunctions = new AWS.StepFunctions({ apiVersion: '2016-11-23' });
const stepfunctionArn = process.env.STEPFUNCTIONARN;
const { v4: uuidv4 } = require('uuid');

exports.handler = (event, context, callback) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`Method only accepts POST method, you tried: ${event.httpMethod} method.`);
    }

    console.info('received:', event);
    const job = JSON.parse(event.body);
    job.jobid = `mljob-${uuidv4()}`;
    job.createdtimestamp = (new Date()).getTime();

    var params = {
        stateMachineArn: stepfunctionArn,
        input: JSON.stringify(job)
    };

    console.log(JSON.stringify(params));

    stepfunctions.startExecution(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            callback(Error(err));
        }
        else {
            console.log(data); // successful response

            callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    jobid: job.jobid,
                    createdtimestamp: job.createdtimestamp
                })
            });
        }
    });
};
