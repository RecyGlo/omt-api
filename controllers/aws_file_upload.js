const fs = require('fs');
const AWS = require('aws-sdk');
const credentials = new AWS.SharedIniFileCredentials({ profile: 'recyglo' });
AWS.config.credentials = credentials;
// AWS.config.update({
//     region: 'ap-southeast-1',
// });
// AWS.config.apiVersions = {
//     s3: '2006-03-01',
// };
const GREET = async (req, res) => res.status(200).send('Welcome to Recyglo API');
const UPLOAD_TO_S3 = async (req, res) => {
    const file = req.file;
    const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash' } });
    let ext = file.originalname.split('.');
    ext = ext[ext.length - 1];
    const filename = `${Number(new Date())}.${ext}`;
    var image = "no";
    // const filename = file.originalname;
    await s3bucket.createBucket(() => {
        var params = {
            Key: filename,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: "public-read",
        };
        s3bucket.upload(params, (error, data) => {
            if (error) {
                return res.status(500).send(error);
            }
            console.log("1 ", data.Location);
            this.image = data.Location;
            // return res.status(200).send({
            //     hello: data.Location,
            //     message: 'Successfully uploaded data',
            // });
            
        });

        // });
    });
    console.log("2 ", image );

}


module.exports = {
    GREET,
    UPLOAD_TO_S3,
};