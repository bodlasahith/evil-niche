# Triggers
## Checking insert conditions for a new piece of data into the arrest records table
We want to guard against people trying to insert data for future years (i.e. years that couldn't possibly have data yet) and negative crime rates.
```sql
CREATE TRIGGER CheckIfArrestRecordsAreValid 
BEFORE INSERT ON CountyArrestRecords 
FOR EACH ROW 
BEGIN 
	IF NEW.year < 2024 
		THEN SET NEW.year = NULL; 
    	END IF;
    	IF NEW.capitalMurder < 0 OR NEW.violentCrimes < 0 OR NEW.crimesAgainstPersons < 0 OR NEW.crimesAgainstProperty < 0 OR NEW.drugOffenses < 0 THEN 
        	SET NEW.year = NULL;
    	END IF;
END;
```

# Procedures
## Stored procedure for recommender system
```sql
DELIMITER $$

CREATE PROCEDURE Recommender (
    IN crimeType VARCHAR(255),
    IN whereClauses TEXT
)
BEGIN
    SET @query = CONCAT('
        WITH MaxSpecifiedCrimes AS (
            SELECT 
                countyName, 
                MAX(', crimeType, ') AS maxNumCrimesForSpecifiedCrime
            FROM 
                CountyArrestRecords
            GROUP BY 
                countyName
        ),
        PoliceInfoForLastYear AS (
            SELECT 
                countyName,
                MAX(year) AS latestYear
            FROM 
                PoliceInfo
            GROUP BY 
                countyName
        ),
        MaxCrimesForLatestYear AS (
            SELECT 
                county_arrest_records.*
            FROM 
                CountyArrestRecords county_arrest_records
            INNER JOIN MaxSpecifiedCrimes mc ON county_arrest_records.countyName = mc.countyName AND county_arrest_records.', crimeType, ' = mc.maxNumCrimesForSpecifiedCrime
        ),
        FinalFilteredData AS (
            SELECT 
                county_demographics.*,
                police_info.agencyName,
                police_info.numOfficers,
                police_info.numOfficersPer1000,
                police_info.year AS policeYear,
                filtered_crimes.', crimeType, ',
                circuit_judicial.acquittalChargeRatio,
                district_government.currentParty
            FROM 
                MaxCrimesForLatestYear filtered_crimes
            JOIN 
                CountyDemographics county_demographics ON filtered_crimes.countyName = county_demographics.countyName
            JOIN 
                CircuitJudicial circuit_judicial ON county_demographics.circuitID = circuit_judicial.circuitID
            JOIN 
                DistrictGovernment district_government ON county_demographics.districtName = district_government.districtName
            JOIN 
                PoliceInfoForLastYear latest_year_info ON county_demographics.countyName = latest_year_info.countyName
            JOIN 
                PoliceInfo police_info ON county_demographics.countyName = police_info.countyName AND latest_year_info.latestYear = police_info.year
            ', whereClauses, '
        )
        SELECT 
            *
        FROM 
            FinalFilteredData
        ORDER BY RAND()
        LIMIT 1;
    ');

    PREPARE recommendation FROM @query;
    EXECUTE recommendation;
    DEALLOCATE PREPARE recommendation;
END$$
```

# Transaction
```sql
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
```

# Constraints
- They are in the DDL
```sql
CREATE TABLE CountyArrestRecords (
    recordID INT NOT NULL AUTO_INCREMENT,
    countyName VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    capitalMurder INT NOT NULL,
    violentCrimes INT NOT NULL,
    crimesAgainstPersons INT NOT NULL,
    crimesAgainstProperty INT NOT NULL, 
    drugOffenses INT NOT NULL,
    PRIMARY KEY(recordID, countyName),
    FOREIGN KEY(countyName) 
        REFERENCES CountyDemographics(countyName)
        ON DELETE CASCADE
);
```