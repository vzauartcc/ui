export interface IUploadProgressCallback {
  (percent: number): number;
}

export const s3Service = {
  async upload(
    url: string,
    fileData: File,
    fileType?: string,
    onProgress?: IUploadProgressCallback,
  ) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress safely on HTTP/1.1
      if (onProgress && xhr.upload) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        });
      }

      xhr.open('PUT', url);
      xhr.setRequestHeader(
        'Content-Type',
        fileType || 'application/octet-stream',
      );
      xhr.setRequestHeader('x-amz-acl', 'public-read');

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload.'));

      // Send the raw file object directly
      xhr.send(fileData);
    });
  },
};
