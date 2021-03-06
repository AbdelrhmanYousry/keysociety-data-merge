const express = require("express");
const algoliasearch = require("algoliasearch");
require("dotenv").config();
const app = express();
console.log("heeeeere");

const { SECRET, ALGO_APP, ALGO_API_KEY, AIRTABLE_API_KEY } = process.env;
// console.log({ SECRET, ALGO_APP, ALGO_API_KEY, AIRTABLE_API_KEY });

const client = algoliasearch(ALGO_APP,ALGO_API_KEY );
const Airtable = require("airtable");
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(
  "appOBAATRYbEAr021"
);
const index = client.initIndex("reindexingdata");
const tmpIndex = client.initIndex("reindexingdata_tmp");

// automated job

var CronJob = require('cron').CronJob;
new CronJob('0 25 */4 * * *', function() {
  console.log('You will see this message every second');
  console.log("doing the job");
  client
    .copyIndex(index.indexName, tmpIndex.indexName, [
      "settings",
      "synonyms",
      "rules"
    ])
    .then(() => {
      // 3. Fetch your data and push it to the temporary index
      const objects = [];
      base("Members")
        .select()
        .eachPage((records, fetchNext) => {
          objects.push(
            ...records.map(rec => {
              const genderObject = {};
              const ethnicityObject = {};
              rec.get("Gender")
                ? rec.get("Gender").map(gen => {
                    genderObject[gen.toLowerCase()] = gen;
                  })
                : null;
              rec.get("Ethnicity")
                ? rec.get("Ethnicity").map(ethn => {
                    ethnicityObject[ethn.toLowerCase()] = ethn;
                  })
                : null;
              return {
                objectID: rec.getId(),
                firstname: rec.get("firstname"),
                lastname: rec.get("lastname"),
                username: rec.get("username"),
                gpa: rec.get("gpa"),
                universityemail: rec.get("universityemail"),
                university: rec.get("University"),
                phone: rec.get("phone"),
                visible: rec.get("visible"),
                keyscore: rec.get("KeyScore"),
                scrubbedtxt: rec.get("Scrubbed Resume"),
                gradyear: rec.get("Grad Year"),
                major: rec.get("major"),
                tfpiclink: rec.get("Picture.jpg")
                  ? rec.get("Picture.jpg")[0].url
                  : null,
                tfresumelink: rec.get("Resume.pdf")
                  ? rec.get("Resume.pdf")[0].url
                  : null,
                ...genderObject,
                ...ethnicityObject
              };
            })
          );

          fetchNext();
        });
      return tmpIndex.addObjects(objects); // for better performance, send your objects in batches
    })
    .then(() => {
      // 4. Move the temporary index to the target index
      return client.moveIndex(tmpIndex.indexName, index.indexName);
    })
    .catch(err => {
      console.error(err);
    });
}, null, true, 'Africa/Cairo');



// force update API
app.get("/force", (req, res) => {
  if (!req.query.key || req.query.key !== SECRET) {
    return res.status(401).json({
      message: "invalid credentials"
    });
  }
  client
    .copyIndex(index.indexName, tmpIndex.indexName, [
      "settings",
      "synonyms",
      "rules"
    ])
    .then(() => {
      // 3. Fetch your data and push it to the temporary index
      const objects = [];
      base("Members")
        .select()
        .eachPage((records, fetchNext) => {
          objects.push(
            ...records.map(rec => {
              const genderObject = {};
              const ethnicityObject = {};
              rec.get("Gender")
                ? rec.get("Gender").map(gen => {
                    genderObject[gen.toLowerCase()] = gen;
                  })
                : null;
              rec.get("Ethnicity")
                ? rec.get("Ethnicity").map(ethn => {
                    ethnicityObject[ethn.toLowerCase()] = ethn;
                  })
                : null;
              return {
                objectID: rec.getId(),
                firstname: rec.get("firstname"),
                lastname: rec.get("lastname"),
                username: rec.get("username"),
                gpa: rec.get("gpa"),
                universityemail: rec.get("universityemail"),
                university: rec.get("University"),
                phone: rec.get("phone"),
                visible: rec.get("visible"),
                keyscore: rec.get("KeyScore"),
                scrubbedtxt: rec.get("Scrubbed Resume"),
                gradyear: rec.get("Grad Year"),
                major: rec.get("major"),
                tfpiclink: rec.get("Picture.jpg")
                  ? rec.get("Picture.jpg")[0].url
                  : null,
                tfresumelink: rec.get("Resume.pdf")
                  ? rec.get("Resume.pdf")[0].url
                  : null,
                ...genderObject,
                ...ethnicityObject
              };
            })
          );

          fetchNext();
        });
      return tmpIndex.addObjects(objects); // for better performance, send your objects in batches
    })
    .then(() => {
      // 4. Move the temporary index to the target index
      return client.moveIndex(tmpIndex.indexName, index.indexName);
    })
    // index.addObjects(objects).
    .then(() => {
      res.status(200).json({
        message: "success"
      });
    })
    .catch(err => {
      console.error(err);
      res.status(400).json({
        message: "error occured while updating"
      });
    });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("server listening on port ", PORT);
});
