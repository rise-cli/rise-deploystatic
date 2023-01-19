import * as cli from 'rise-cli-foundation'
import * as filesystem from 'rise-filesystem-foundation'
import * as aws from 'rise-aws-foundation'
import { deployApplication } from './utils/deployApplication.mjs'
import { deployToAmplify } from './utils/deployToAmplify.mjs'

export async function deployStaticSite(config) {
    /**
     * Start
     */
    console.time('✅ Deployed Successfully \x1b[2mDeploy Time')
    cli.hideCursor()

    /**
     * Zip
     */
    cli.clear()
    cli.startLoadingMessage('Zipping Code')
    await filesystem.zipFolder({
        source: config.zipConfig.source,
        target: config.zipConfig.target,
        name: config.zipConfig.name,
        projectRoot: process.cwd()
    })

    const deployName = config.deployName
    cli.endLoadingMessage()

    /**
     * Deploy Infra
     */
    if (!config.app.bucketName) {
        const res = await deployApplication(
            deployName,
            config.app.stage,
            config.app.region,
            config.app.auth || null
        )

        config.app.bucketName = res.bucket
        config.app.appId = res.appId
    }
    cli.clear()

    /**
     * Upload data to S3
     */
    cli.startLoadingMessage('Uploading code to AWS S3')
    const zipPath =
        config.zipConfig.target + '/' + config.zipConfig.name + '.zip'
    const uploadFile = await filesystem.getFile({
        path: zipPath,
        projectRoot: process.cwd()
    })
    await aws.s3.uploadFile({
        file: uploadFile,
        bucket: config.app.bucketName,
        key: config.zipConfig.name + '.zip'
    })
    cli.endLoadingMessage()
    cli.clear()

    /**
     * Execute Amplify deployment
     */
    cli.clear()
    cli.startLoadingMessage('Deploying to AWS Amplify')
    await deployToAmplify(config)
    cli.endLoadingMessage()
    cli.clear()

    /**
     * End
     */
    console.timeEnd('✅ Deployed Successfully \x1b[2mDeploy Time')
    console.log('')
    cli.printInfoMessage(
        `Endpoint: https://main.${config.app.appId}.amplifyapp.com`
    )
    cli.showCursor()
}
