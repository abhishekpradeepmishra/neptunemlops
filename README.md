## Neptune ML 

Amazon Neptune ML is a new capability of Neptune that uses Graph Neural Networks (GNNs), a machine learning technique purpose-built for graphs, to make easy, fast, and more accurate predictions using graph data. 
With Neptune ML, you can improve the accuracy of most predictions for graphs by over 50% when compared to making predictions using non-graph methods.

## Neptune ML Ops

Neptune ML Ops automates the process of creating and managing one/multiple Neptune ML jobs is parallel. The state machine driven workflows helps run the Neptune ML task with a single APi call.

![](stepfunctions.png)

## Install Nodejs & SAM

https://nodejs.org/en/download/
https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install-mac.html

## Build

Do a git clone of the repository locally. Navigate to the root folder of the repo and run commands below

```
npm install
sam build

```

## Deployment

```
sam deploy --guided

```


