import axios from 'axios';
import fs from 'fs';

const baseUrl = 'http://localhost:3000';

const multipartParams = {
    fileKey: 'ML/MediaLibrary',
    contentType: "mp4",
}

// start multipart upload
export const startMultipartUpload = async () => {
    const res = await axios.post(`${baseUrl}/media-management/multipart/start`, {
        ...multipartParams,
    });
    return res.data;
}

const start = await startMultipartUpload();

console.log('start', start);

const getFileFromSystem = async () => {
    const file = await fs.readFileSync('./test2.mp4');
    return file;
}

const file = await getFileFromSystem();

const chunkSize = 5 * 1024 * 1024;

const numberOfChunks = Math.ceil(file.length / chunkSize);

// get multipart signed urls
const getMultipartSignedUrls = async () => {
    const res = await axios.post(`${baseUrl}/media-management/multipart/get-signed-urls`, {
        UploadId: start.UploadId,
        Key: start.Key,
        ChunksNumber: numberOfChunks,
    });
    return res.data;
}

const signedUrls = await getMultipartSignedUrls();

console.log('signedUrls', signedUrls);

// upload chunks
const uploadChunks = async () => {
    const promises = [];
    for (let i = 0; i < numberOfChunks; i++) {
        const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
        console.log('chunk', chunk)
        const part = await axios.put(signedUrls.parts[i].signedUrl, chunk);
        // get etag from part
        console.log('part etag', part.headers.etag)
        promises.push(part);
    }
    return Promise.all(promises);
}

const upload = await uploadChunks();

console.log('upload', upload);

const Parts = upload.map((part, index) => ({
    ETag: part.headers.etag.replace(/"/g, ''),
    PartNumber: index + 1,
}));

console.log('Parts', Parts)

const completeMultipartUpload = async () => {
    const res = await axios.post(`${baseUrl}/media-management/multipart/complete`, {
        UploadId: start.UploadId,
        Key: start.Key,
        Parts
    });
    return res.data;
}

const complete = await completeMultipartUpload();

console.log('complete', complete);