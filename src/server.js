var express = require("express");
var bodyParser = require("body-parser");
var mysql = require("mysql2");
var path = require("path");
const { table } = require("console");
const { randomBytes } = require("crypto");
var connection = mysql.createConnection({
  host: "34.69.94.61",
  user: "root",
  password: "",
  database: "EvilNiche",
});

connection.connect();

var app = express();
app.use(bodyParser.json());

// set up ejs view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "../public"));

/* GET home page, respond by rendering index.ejs */
app.get("/", function (req, res) {
  // res.render("index", { title: "Mark Attendance" });
  res.render('index', { results: null });
});

app.get("/success", function (req, res) {
  res.send({ message: "County arrest records inserted successfully!" });
});

// this code is executed when a user clicks the form submit button
app.post("/mark", function (req, res) {
  var countyName = req.body.countyName;
  var year = req.body.year;
  var capitalMurder = req.body.capitalMurder;
  var violentCrimes = req.body.violentCrimes;
  var crimesAgainstPersons = req.body.crimesAgainstPersons;
  var crimesAgainstProperty = req.body.crimesAgainstProperty;
  var drugOffenses = req.body.drugOffenses;
  var sql = `INSERT INTO CountyArrestRecords (countyName, year, capitalMurder, violentCrimes, crimesAgainstPersons, crimesAgainstProperty, drugOffenses) VALUES ('${countyName}', ${year}, ${capitalMurder}, ${violentCrimes}, ${crimesAgainstPersons}, ${crimesAgainstProperty}, ${drugOffenses});`;

  console.log(sql);
  connection.query(sql, function (err, result) {
    if (err) {
      res.send(err);
      return;
    }
    res.redirect("/success");
  });
});

app.post('/submit-form', (req, res) => {
  const formData = req.body;

  let whereClauses = [];
  let crimeType = ``;
  
  // crime selection
  if (formData.crime === 'persons') {
      crimeType = `crimesAgainstPersons`;
      // whereClauses.push(`car.crimesAgainstPersons > 300`);
  } else if (formData.crime === 'capital') {
      crimeType = `capitalMurder`;
      // whereClauses.push(`car.capitalMurder > 10`);
  } else if (formData.crime === 'violent') {
      crimeType = `violentCrimes`;
      // whereClauses.push(`car.violentCrimes > 100`);
  } else if (formData.crime === 'property') {
      crimeType = `crimesAgainstProperty`;
      // whereClauses.push(`car.crimesAgainstProperty > 100`);
  } else if (formData.crime === 'drug') {
      crimeType = `drugOffenses`;
      // whereClauses.push(`car.drugOffenses > 100`);
  }

  // political party
  if (formData.party === 'democrat') {
      whereClauses.push(`district_government.currentParty <> 'Democrat'`);
  } else if (formData.party === 'republican') {
      whereClauses.push(`district_government.currentParty <> 'Republican'`);
  }

  // area to commit crime
  if (formData.area === 'urban') {
      whereClauses.push(`county_demographics.populationDensity > 1000`);
  } else if (formData.area === 'suburban') {
      whereClauses.push(`county_demographics.populationDensity <= 1000`);
      whereClauses.push(`county_demographics.populationDensity > 100`);
  } else if (formData.area === 'rural') {
      whereClauses.push(`county_demographics.populationDensity < 100`);
      whereClauses.push(`county_demographics.populationDensity > 0`);
  }
  
  // police presence
  if (formData.police === 'low-police') {
      whereClauses.push('police_info.numOfficersPer1000 < 100');
  } else if (formData.police === 'high-police') {
      whereClauses.push('police_info.numOfficersPer1000 > 0.0');
  }

  // acquittal rate
  if (formData.acquittal === 'low-rate') {
    whereClauses.push('circuit_judicial.acquittalChargeRatio > 0.0');
  } else if (formData.acquittal === 'high-rate') {
    whereClauses.push('circuit_judicial.acquittalChargeRatio >= 0.003');
  }

  var whereString = '';
  if (whereClauses.length > 0) {
    whereString = 'WHERE ';
  }
  whereString += whereClauses.length ? whereClauses.join(' AND ') : '';

  const query = `CALL Recommender(?, ?);`;
    connection.query(query, [crimeType, whereString], (error, results, fields) => {
      if (error) {
          console.error('SQL query error:', error);
          return res.status(500).send('An error occurred with the database.');
      }

      if (results[0].length > 0) {
        const countyData = results[0][0];
        const countyName = countyData.countyName;

        // Construct the SVG file path
        const svgFilePath = `/api/image/${countyName}.svg`;

        res.render('index', { results: results[0][0], svgFilePath: svgFilePath });
      } else {
        res.render('index', { results: null, svgFilePath: svgFilePath });
      }
  });
});

app.get('/api/image/:countyName', (req, res) => {
  const countyName = req.params.countyName;
  const filePath = `images/${countyName}.svg`;
  res.sendFile(filePath, { root: __dirname });
});

app.get("/api/precision", function (req, res) {
  var sqlCountyDemographics = "SELECT * FROM CountyDemographics;";
  var sqlPoliceInfo = "SELECT * FROM PoliceInfo;";
  var sqlCountyArrestRecords = "SELECT * FROM CountyArrestRecords;";
  var sqlCircuitJudicial = "SELECT * FROM CircuitJudicial;";
  var sqlDistrictGovernment = "SELECT * FROM DistrictGovernment;";

  var dataArray = [];

  connection.query(
    sqlCountyDemographics,
    function (err1, countyDemographicsResults) {
      if (err1) {
        console.error("Error fetching CountyDemographics data:", err1);
        res.status(500).send({
          message: "Error fetching CountyDemographics data",
          error: err1,
        });
        return;
      }

      dataArray.push({ countyDemographics: countyDemographicsResults });

      connection.query(sqlPoliceInfo, function (err2, policeInfoResults) {
        if (err2) {
          console.error("Error fetching PoliceInfo data:", err2);
          res
            .status(500)
            .send({ message: "Error fetching PoliceInfo data", error: err2 });
          return;
        }

        dataArray.push({ policeInfo: policeInfoResults });

        connection.query(
          sqlCountyArrestRecords,
          function (err3, countyArrestRecordsResults) {
            if (err3) {
              console.error("Error fetching CountyArrestRecords data:", err3);
              res.status(500).send({
                message: "Error fetching CountyArrestRecords data",
                error: err3,
              });
              return;
            }

            dataArray.push({ countyArrestRecords: countyArrestRecordsResults });

            connection.query(
              sqlCircuitJudicial,
              function (err4, circuitJudicialResults) {
                if (err4) {
                  console.error("Error fetching CircuitJudicial data:", err4);
                  res.status(500).send({
                    message: "Error fetching CircuitJudicial data",
                    error: err4,
                  });
                  return;
                }

                dataArray.push({ circuitJudicial: circuitJudicialResults });

                connection.query(
                  sqlDistrictGovernment,
                  function (err5, districtGovernmentResults) {
                    if (err5) {
                      console.error(
                        "Error fetching DistrictGovernment data:",
                        err5
                      );
                      res.status(500).send({
                        message: "Error fetching DistrictGovernment data",
                        error: err5,
                      });
                      return;
                    }

                    dataArray.push({
                      districtGovernment: districtGovernmentResults,
                    });

                    res.status(200).json(dataArray);
                  }
                );
              }
            );
          }
        );
      });
    }
  );
});

app.delete("/api/attendance/delete/", function (req, res) {
  const table = req.body.table;
  const value = req.body.key;
  const value2 = req.body.value;

  var sql = getDeleteQuery(table, value, value2);

  connection.query(sql, function (err, result) {
    if (err) {
      console.error("Error deleting attendance record:", err);
      res
        .status(500)
        .send({ message: "Error deleting attendance record", error: err });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).send({ message: "Record not found" });
    } else {
      res.send({ message: "Attendance record deleted successfully" });
    }
  });
});

app.post("/api/attendance/update/", function (req, res) {
  const newValue = req.body.newValue;
  const attr = req.body.attribute;
  const key = req.body.key;
  const value = req.body.value;
  const table = req.body.table;

  var sql = getUpdateQuery(table, key, value, attr, newValue);

  connection.query(sql, function (err, result) {
    if (err) {
      console.error("Error updating attendance record:", err);
      res
        .status(500)
        .send({ message: "Error updating attendance record", error: err });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).send({ message: "Record not found" });
    } else {
      // res.send({ message: "Attendance record updated successfully" });
    }
  });
});

app.post("/api/attendance/improvePolice/", function (req, res) {
  connection.beginTransaction(function (err) {
    if (err) {
      console.error("Error starting transaction:", err);
      connection.rollback(function () {
        res.status(500).send({ message: "Error starting transaction", error: err });
      });
      return;
    }

    const query1 = `

    START TRANSACTION;

    CREATE TEMPORARY TABLE temp_police_info
    SELECT pir.countyName, pir.numOfficersPer1000,
           pir.numOfficersPer1000 * 1.1 AS updated_numOfficersPer1000
    FROM PoliceInfo pir
    JOIN (
      SELECT cd.countyName, car.crimesAgainstPersons
      FROM CountyDemographics cd
      JOIN CountyArrestRecords car ON cd.countyName = car.countyName
      WHERE car.crimesAgainstPersons > (
        SELECT AVG(crimesAgainstPersons)
        FROM CountyArrestRecords
      )
      AND car.year = (
        SELECT MAX(year)
        FROM CountyArrestRecords
      )
    ) AS high_crime_areas ON pir.countyName = high_crime_areas.countyName
    WHERE pir.numOfficersPer1000 < (
      SELECT AVG(numOfficersPer1000)
      FROM PoliceInfo
    );

    UPDATE PoliceInfo pir
    JOIN temp_police_info tmp ON pir.countyName = tmp.countyName
    SET pir.numOfficersPer1000 = tmp.updated_numOfficersPer1000;
    
    DROP TEMPORARY TABLE temp_police_info;

    COMMIT; 
    `;

    connection.query(query1, function (err, result) {
      if (err) {
        console.error("Error updating attendance record:", err);
        res
          .status(500)
          .send({ message: "Error updating attendance record", error: err });
        return;
      }
      if (result.affectedRows === 0) {
        res.status(404).send({ message: "Record not found" });
      } else {
        // res.send({ message: "Attendance record updated successfully" });
      }
    });
  
  });
});


app.listen(80, function () {
  console.log("Node app is running on port 80");
});

function getDeleteQuery(tableName, value1, value2) {
  if (tableName === "CountyDemographics") {
    return `DELETE FROM ${tableName} WHERE countyName = '${value1}';`;
  } else if (tableName === "CountyArrestRecords") {
    return `DELETE FROM ${tableName} WHERE recordID = ${value1};`;
  } else if (tableName === "PoliceInfo") {
    return `DELETE FROM ${tableName} WHERE agencyName = '${value1}' AND year = ${value2};`;
  } else if (tableName === "DistrictGovernment") {
    return `DELETE FROM ${tableName} WHERE districtName = '${value1}';`;
  } else if (tableName === "CircuitJudicial") {
    return `DELETE FROM ${tableName} WHERE recordID = ${value1};`;
  }
}

function getUpdateQuery(tableName, value1, value2, attr, newValue) {
  const isNewValueString = typeof newValue === 'string';

  if (tableName === "CountyDemographics") {
    return `UPDATE ${tableName} SET ${attr} = ${isNewValueString ? `'${newValue}'` : newValue} WHERE countyName = '${value1}'`;
  } else if (tableName === "PoliceInfo") {
    return `UPDATE ${tableName} SET ${attr} = ${isNewValueString ? `'${newValue}'` : newValue} WHERE agencyName = '${value1}' AND year = ${value2}`;
  } else if (tableName === "CountyArrestRecords") {
    return `UPDATE ${tableName} SET ${attr} = ${isNewValueString ? `'${newValue}'` : newValue} WHERE recordID = ${value1}`;
  } else if (tableName === "DistrictGovernment") {
    return `UPDATE ${tableName} SET ${attr} = ${isNewValueString ? `'${newValue}'` : newValue} WHERE districtName = '${value1}'`;
  } else if (tableName === "CircuitJudicial") {
    return `UPDATE ${tableName} SET ${attr} = ${isNewValueString ? `'${newValue}'` : newValue} WHERE recordID = ${value1}`;
  }
}