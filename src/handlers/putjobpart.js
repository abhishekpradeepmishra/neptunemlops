const tableName = process.env.NEPTUNEMLOPSDYNAMODBTABLE;
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();
const exportserviceurl = `https://${process.env.NEPTUNEEXPORTURL}/v1/neptune-export`;
const neptuneendpoint = `https://${process.env.NEPTUNEENDPOINT}:${process.env.NEPTUNEPORT}`;
const axios = require('axios').default;


async function setjobstatus(jobdetails, updateexpression, expressionattributenames, expressionattributevalues) {
  var params = {
    TableName: tableName,
    Key: {
      jobid: jobdetails.jobid,
      jobstep: jobdetails.jobstep
    },
    UpdateExpression: updateexpression,
    ExpressionAttributeNames: expressionattributenames,
    ExpressionAttributeValues: expressionattributevalues
  };

  await docClient.update(params).promise();
}


async function runexportjob(jobdetails, data) {
  let exportparams = JSON.parse(data.Item.exportparams);
  let response = await axios.post(exportserviceurl, exportparams);

  console.log(response.data);


  await setjobstatus(jobdetails,
    'set #e = :exportJobId, #s = :status ', { '#e': 'exportJobId', '#s': 'status' }, {
      ':exportJobId': response.data.jobId,
      ':status': "inprogress"
    });

  return {
    "jobid": jobdetails.jobid,
    "jobstep": jobdetails.jobstep,
    "status": "inprogress"
  }
}

async function rundataprocessingjob(jobdetails, data) {
  var inputJSON = {
    "inputDataS3Location": jobdetails.s3_input_uri,
    "id": data.Item.jobid,
    "processedDataS3Location": data.Item.s3_processed_uri
  };

  console.log("sending request for processing");
  console.log(JSON.stringify(inputJSON));

  let response = await axios.post(neptuneendpoint + "/ml/dataprocessing", inputJSON);

  if (response.status === 200) {
    await setjobstatus(jobdetails,
      'set #s = :status ', { '#s': 'status' }, {
        ':status': "inprogress"
      });

    return {
      "jobid": jobdetails.jobid,
      "jobstep": jobdetails.jobstep,
      "status": "inprogress"
    }
  }
  else {
    return {
      "jobid": jobdetails.jobid,
      "jobstep": jobdetails.jobstep,
      "status": "failed"
    }
  }

}

async function runtrainingjob(jobdetails, data) {
  let response = await axios.post(neptuneendpoint + "/ml/modeltraining", {
    "dataProcessingJobId": data.Item.jobid,
    "id": data.Item.jobid,
    "trainModelS3Location": data.Item.s3_output_uri,
    "maxHPONumberOfTrainingJobs": data.Item.max_hpo_number,
    "maxHPOParallelTrainingJobs": data.Item.max_hpo_parallel,
    "trainingInstanceType": data.Item.instance_type
  });

  if (response.status === 200) {
    await setjobstatus(jobdetails,
      'set #s = :status ', { '#s': 'status' }, {
        ':status': "inprogress"
      });


    return {
      "jobid": jobdetails.jobid,
      "jobstep": jobdetails.jobstep,
      "status": "inprogress"
    }
  }
  else {
    return {
      "jobid": jobdetails.jobid,
      "jobstep": jobdetails.jobstep,
      "status": "failed"
    }
  }

}

async function runendpointcreationjob(jobdetails, data) {
  let response = await axios.post(neptuneendpoint + "/ml/endpoints", {
    "mlModelTrainingJobId": data.Item.jobstep,
    "id": data.Item.jobid
  });

  if (response.status === 200) {
    await setjobstatus(jobdetails,
      'set #s = :status ', { '#s': 'status' }, {
        ':status': "inprogress"
      });


    return {
      "jobid": jobdetails.jobid,
      "jobstep": jobdetails.jobstep,
      "status": "inprogress"
    }
  }
  else {
    return {
      "jobid": jobdetails.jobid,
      "jobstep": jobdetails.jobstep,
      "status": "failed"
    }
  }
}
exports.handler = async (event) => {
  const jobdetails = event;
  var params = {
    TableName: tableName,
    Key: {
      jobid: jobdetails.jobid,
      jobstep: jobdetails.jobstep
    },
  };

  const data = await docClient.get(params).promise();

  if (data.Item.status === "pending") {
    if (jobdetails.jobstep.indexOf("export") !== -1) {
      await runexportjob(jobdetails, data)
    }
    else if (jobdetails.jobstep.indexOf("dataprocessing") !== -1) {
      await rundataprocessingjob(jobdetails, data)
    }
    else if (jobdetails.jobstep.indexOf("training") !== -1) {
      await runtrainingjob(jobdetails, data);
    }
    else if (jobdetails.jobstep.indexOf("endpoint") !== -1) {
      await runendpointcreationjob(jobdetails, data)
    }
  }
}
