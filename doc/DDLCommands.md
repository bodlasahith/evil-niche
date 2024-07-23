### DistrictGovernment

```sql
CREATE TABLE DistrictGovernment (
    districtName VARCHAR(255) NOT NULL,
    currentParty VARCHAR(255) NOT NULL,
    representativeName VARCHAR(255) NOT NULL,
    PRIMARY KEY(districtName)
);
```

### CircuitJudicial

```sql
CREATE TABLE CircuitJudicial(
    recordID INT NOT NULL AUTO_INCREMENT,
    circuitID INT NOT NULL,
    year INT NOT NULL,
    filings INT,
    charges INT NOT NULL,
    acquittals INT NOT NULL,
    pleas INT NOT NULL,
    convictions INT NOT NULL,
    juryTrialRates FLOAT NOT NULL,
    PRIMARY KEY(recordID)
); 	
```

### CountyDemographics

```sql
CREATE TABLE CountyDemographics (
    countyName VARCHAR(255) NOT NULL, 
    districtName VARCHAR(255) NOT NULL,
    circuitID INT NOT NULL, 
    population INT NOT NULL, 
    populationDensity FLOAT NOT NULL, 
    medianIncome INT, 
    percentWhite FLOAT, 
    povertyRate FLOAT, 
    literacyScore INT, 
    PRIMARY KEY(countyName),
    FOREIGN KEY(districtName)
        REFERENCES DistrictGovernment(districtName) 
        ON DELETE CASCADE
    FOREIGN KEY(circuitID)
        REFERENCES CircuitJudicial(circuitID)
        ON DELETE SET NULL 
);
```

### PoliceInfo

```sql
CREATE TABLE PoliceInfo (
    year INT NOT NULL,
    agencyName VARCHAR(255) NOT NULL,
    countyName VARCHAR(225) NOT NULL, 
    numOfficers INT NOT NULL,
    numOfficersPer1000 FLOAT,
    PRIMARY KEY(year, agencyName),
    FOREIGN KEY(countyName) 
        REFERENCES CountyDemographics(countyName)
        ON DELETE CASCADE
);
```

### CountyArrestRecords

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
