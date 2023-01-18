# Rise DeployStatic

## Install

```js
npm i rise-deploystatic
```

## Usage

```js
import { deployStaticSite } from 'rise-deploystatic'

async function main() {
    await deployStaticSite({
        app: {
            stage: 'dev',
            region: 'us-east-1',
            bucketName: 'bucket-name',
            appId: 'amplif-id'
        },
        zipConfig: {
            source: '/dist',
            target: '/.hidden',
            name: 'static'
        },
        deployName: 'name-of-app'
    })
}

main()
```
