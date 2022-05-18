const AWS = require('aws-sdk');
const stepfunctions = new AWS.StepFunctions({ apiVersion: '2016-11-23' });
const stepfunctionArn = process.env.STEPFUNCTIONARN;
const { v4: uuidv4 } = require('uuid');

exports.handler = (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }

    console.info('received:', event);
    const job = JSON.parse(event.body);
    //const job = event.body;
    job.jobid = `mljob-${uuidv4()}`;
    job.createdtimestamp = (new Date()).getTime();

    var params = {
        stateMachineArn: stepfunctionArn,
        input: JSON.stringify(job)
    };

    console.log(JSON.stringify(params));

    //const invocationresponse = await stepfunctions.startExecution(params);

    stepfunctions.startExecution(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            return {
                statusCode: 500,
                body: err.stack
            };
        }
        else {
            console.log(data); // successful response

            return {
                statusCode: 200,
                body: {
                    jobid: job.jobid,
                    createdtimestamp: job.createdtimestamp
                }
            };
        }
    });
};
