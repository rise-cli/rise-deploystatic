import * as filesystem from 'rise-filesystem-foundation'
import * as aws from 'rise-aws-foundation'
import { deployInfra } from 'rise-deployinfra'
import process from 'node:process'

/**
 * @param {string} appName
 * @param {string} stage
 * @param {string} region
 */
export async function deployApplicationBucket(appName, stage, region) {
    let bucketTemplate = aws.s3.makeBucket('Main')
    const stackName = appName + stage + '-bucket'

    const template = {
        Resources: {
            AmplifyApp: {
                Type: 'AWS::Amplify::App',
                Properties: {
                    Name: appName
                }
            },
            AmplifyMainBranch: {
                Type: 'AWS::Amplify::Branch',
                Properties: {
                    AppId: { 'Fn::GetAtt': ['AmplifyApp', 'AppId'] },
                    BranchName: 'main'
                }
            },
            ...bucketTemplate.Resources
        },
        Outputs: {
            ...bucketTemplate.Outputs,
            AmplifyId: {
                Value: { 'Fn::GetAtt': ['AmplifyApp', 'AppId'] }
            }
        }
    }

    const result = await deployInfra({
        name: stackName,
        stage,
        region,
        template: JSON.stringify(template),
        outputs: ['MainBucket', 'AmplifyId']
    })

    if (result.status === 'error') {
        throw new Error(result.message)
    }

    filesystem.writeFile({
        path: '/.rise/data.js',
        content: `export const config = { 
            bucketName: "${result.outputs.MainBucket}", 
            appId: "${result.outputs.AmplifyId}"
        }`,
        projectRoot: process.cwd()
    })

    return {
        bucket: result.outputs.MainBucket,
        appId: result.outputs.AmplifyId
    }
}
