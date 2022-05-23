const tableName = process.env.NEPTUNEMLOPSDYNAMODBTABLE;
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();
const exportserviceurl = `https://${process.env.NEPTUNEEXPORTURL}/v1/neptune-export`;
const neptuneendpoint = `https://${process.env.NEPTUNEENDPOINT}:${process.env.NEPTUNEPORT}`;
const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');
exports.handler = async (event) => {
    console.info('received:', event);
    const job = event;
    var params = {
        RequestItems: {}
    };

    job.part_export.exportparams.outputS3Path = `${job.s3bucket}/${job.part_export.exportparams.outputS3Path}`;
    
    params.RequestItems[tableName] = [{
            PutRequest: {
                Item: {
                    jobid: job.jobid,
                    jobstep: job.part_export.jobstep,
                    status: job.part_export.jobstatus,
                    type: job.type,
                    createdtimestamp: job.createdtimestamp,
                    s3bucket: job.s3bucket,
                    exportparams: JSON.stringify(job.part_export.exportparams)
                }
            }
        },
        {
            PutRequest: {
                Item: {
                    jobid: job.jobid,
                    jobstep: job.part_dataprocessing.jobstep,
                    status: job.part_dataprocessing.jobstatus,
                    type: job.type,
                    createdtimestamp: job.createdtimestamp,
                    configfilename: job.part_dataprocessing.config_file_name,
                    s3_input_uri: `${job.s3bucket}/${job.part_dataprocessing.s3_input_uri}`,
                    s3_processed_uri: `${job.s3bucket}/${job.part_dataprocessing.s3_processed_uri}`
                }
            }
        },
        {
            PutRequest: {
                Item: {
                    jobid: job.jobid,
                    jobstep: job.part_training.jobstep,
                    status: job.part_training.jobstatus,
                    type: job.type,
                    createdtimestamp: job.createdtimestamp,
                    data_processing_id: job.part_training.data_processing_id,
                    instance_type: job.part_training.instance_type,
                    s3_output_uri: `${job.s3bucket}/${job.part_training.s3_output_uri}`,
                    max_hpo_number: job.part_training.max_hpo_number,
                    max_hpo_parallel: job.part_training.max_hpo_parallel
                }
            }
        },
        {
            PutRequest: {
                Item: {
                    jobid: job.jobid,
                    jobstep: job.part_endpoint.jobstep,
                    status: job.part_endpoint.jobstatus,
                    type: job.type,
                    createdtimestamp: job.createdtimestamp,
                    model_training_job_id: job.part_endpoint.model_training_job_id,
                    s3bucket: job.s3bucket
                }
            }
        }
    ];

    await docClient.batchWrite(params).promise();
    
    const response = {
        statusCode: 200,
        body: {
            jobid: job.jobid
        }
    };
    
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
