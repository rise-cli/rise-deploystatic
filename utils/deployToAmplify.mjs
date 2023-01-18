import aws from 'aws-sdk'

const wait = () => new Promise((r) => setTimeout(r, 2000))
async function checkDeployStatus(amplify, appId, jobId, count) {
    if (count > 100) {
        throw new Error('Deployment is taking longer than usual')
    }
    const jobStatus = await amplify
        .getJob({
            appId: appId,
            branchName: 'main',
            jobId: jobId
        })
        .promise()

    if (
        jobStatus.job.summary.status === 'PENDING' ||
        jobStatus.job.summary.status === 'RUNNING'
    ) {
        await wait()
        return await checkDeployStatus(amplify, appId, jobId, count + 1)
    }

    return jobStatus.job.summary.status
}

export async function deployToAmplify(config) {
    const amplify = new aws.Amplify({
        region: config.app.region
    })
    const res = await amplify
        .startDeployment({
            appId: config.app.appId,
            branchName: 'main',
            sourceUrl: `s3://${config.app.bucketName}/${
                config.zipConfig.name + '.zip'
            }`
        })
        .promise()
    await checkDeployStatus(amplify, config.app.appId, res.jobSummary.jobId, 0)
}
