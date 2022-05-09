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

async function getexportjobstatus(jobdetails, data) {
  let exportparams = JSON.parse(data.Item.exportparams);
  let response = await axios.get(exportserviceurl + "/" + data.Item.exportJobId);

  console.log(response.data);

  if (response.data.status === "succeeded") {

    await setjobstatus(jobdetails,
      'set #e = :outputS3Uri, #s = :status ', { '#e': 'outputS3Uri', '#s': 'status' }, {
        ':outputS3Uri': response.data.outputS3Uri,
        ':status': "complete"
      });

    return {
      jobid: jobdetails.jobid,
      jobstep: jobdetails.jobstep,
      status: "complete",
      outputS3Uri: response.data.outputS3Uri
    }
  }
  else {
    return {
      jobid: jobdetails.jobid,
      jobstep: jobdetails.jobstep,
      status: "inprogress"
    }
  }
}

async function getdataprocessingjobstatus(jobdetails, data) {
  let response = await axios.get(neptuneendpoint + "/ml/dataprocessing/" + jobdetails.jobid);

  if (response.data.status === "Completed") {
    await setjobstatus(jobdetails,
      'set #e = :outputLocation, #s = :status ', { '#e': 'outputLocation', '#s': 'status' }, {
        ':outputLocation': response.data.processingJob.outputLocation,
        ':status': "complete"
      }
    );

    return {
      jobid: jobdetails.jobid,
      jobstep: jobdetails.jobstep,
      status: "complete",
      outputLocation: response.data.processingJob.outputLocation
    }
  }
  else {
    return {
      jobid: jobdetails.jobid,
      jobstep: jobdetails.jobstep,
      status: "inprogress"
    }
  }
}

async function gettrainingjobstatus(jobdetails, data) {
  let response = await axios.get(neptuneendpoint + "/ml/modeltraining/" + jobdetails.jobstep);

  if (response.data.status === "Completed") {
    await setjobstatus(jobdetails,
      'set #s = :status ', { '#s': 'status' }, {
        ':status': "complete"
      }
    );

    return {
      jobid: jobdetails.jobid,
      jobstep: jobdetails.jobstep,
      status: "complete"
    }
  }
  else {
    return {
      jobid: jobdetails.jobid,
      jobstep: jobdetails.jobstep,
      status: "inprogress"
    }
  }
}

async function getendpointcreationjobstatus(jobdetails, data) {
  let response = await axios.get(neptuneendpoint + "/ml/endpoints/" + jobdetails.jobstep);

  if (response.data.status === "InService") {

    await setjobstatus(jobdetails,
      'set #e = :endpoint, #s = :status ', { '#e': 'endpoint', '#s': 'status' }, {
        ':endpoint': response.data.endpoint.name,
        ':status': "complete"
      }
    );

    return {
      jobid: jobdetails.jobid,
      jobstep: jobdetails.jobstep,
      status: "complete",
      endpoint: response.data.endpoint.name
    }
  }
  else {
    return {
      jobid: jobdetails.jobid,
      jobstep: jobdetails.jobstep,
      status: "inprogress"
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

  if (data.Item.status === "inprogress") {
    if (jobdetails.jobstep.indexOf("export") !== -1) {
      await getexportjobstatus(jobdetails, data);
    }
    else if (jobdetails.jobstep.indexOf("dataprocessing") !== -1) {
      await getdataprocessingjobstatus(jobdetails, data);
    }
    else if (jobdetails.jobstep.indexOf("training") !== -1) {
      await gettrainingjobstatus(jobdetails, data);
    }
    else if (jobdetails.jobstep.indexOf("endpoint") !== -1) {
      await getendpointcreationjobstatus(jobdetails, data)
    }
  }
}
