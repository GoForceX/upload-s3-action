import * as core from '@actions/core';
import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import * as fs from 'node:fs';
import * as path from 'node:path';
import shortid from 'shortid';
import slash from 'slash';
import klawSync from 'klaw-sync';
import { lookup } from 'mime-types';

const AWS_KEY_ID = core.getInput('aws_key_id', {
  required: true,
});
const SECRET_ACCESS_KEY = core.getInput('aws_secret_access_key', {
  required: true,
});
const BUCKET = core.getInput('aws_bucket', {
  required: true,
});
const SOURCE_DIR = core.getInput('source_dir', {
  required: true,
});
const DESTINATION_DIR = core.getInput('destination_dir', {
  required: false,
});
const ENDPOINT = core.getInput('endpoint', {
  required: false,
});

const s3options = {
  accessKeyId: AWS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
};

if (ENDPOINT) {
  s3options.endpoint = ENDPOINT;
}

const s3 = new S3(s3options);
const destinationDir = DESTINATION_DIR === '/' ? shortid() : DESTINATION_DIR;
const paths = klawSync(SOURCE_DIR, {
  nodir: true,
});

function upload(params) {
  return new Upload({
    client: s3,
    params,
  })
    .done()
    .then((data) => {
      core.info(`uploaded - ${data.Key}`);
      core.info(`located - ${data.Location}`);
      return data.Location;
    })
    .catch((err) => {
      core.error(err);
      throw err;
    });
}

function run() {
  const sourceDir = slash(path.join(process.cwd(), SOURCE_DIR));
  return Promise.all(
    paths.map((p) => {
      const fileStream = fs.createReadStream(p.path);
      const bucketPath = slash(
        path.join(destinationDir, slash(path.relative(sourceDir, p.path)))
      );
      const params = {
        Bucket: BUCKET,
        ACL: 'public-read',
        Body: fileStream,
        Key: bucketPath,
        ContentType: lookup(p.path) || 'text/plain',
      };
      return upload(params);
    })
  );
}

run()
  .then((locations) => {
    core.info(`object key - ${destinationDir}`);
    core.info(`object locations - ${locations}`);
    core.setOutput('object_key', destinationDir);
    core.setOutput('object_locations', locations);
  })
  .catch((err) => {
    core.error(err);
    core.setFailed(err.message);
  });
