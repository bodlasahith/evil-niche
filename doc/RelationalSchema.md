## Relational Schema

```
District-Government(districtName: VARCHAR NOT NULL [PK], currentParty: VARCHAR NOT NULL, representativeName: VARCHAR NOT NULL)

Circuit-Judicial(recordID: INT NOT NULL [PK], circuitID: INT NOT NULL, year: INT NOT NULL, filings: INT, charges: INT NOT NULL, acquittals: INT NOT NULL, pleas: INT NOT NULL, convictions: INT NOT NULL, juryTrialRates: FLOAT NOT NULL)

County-Demographics(countyName: VARCHAR NOT NULL [PK], districtName: VARCHAR NOT NULL [FK to District-Government.districtName], circuitID: INT NOT NULL [FK to Circuit-Judicial.circuitID], population: INT NOT NULL, populationDensity: FLOAT NOT NULL, medianIncome: INT, percentWhite: FLOAT, povertyRate: FLOAT, literacyScore: INT)

Police-Info(year: INT NOT NULL [PK], agencyName: VARCHAR NOT NULL [PK], countyName: VARCHAR NOT NULL [FK to County-Demographics.countyName], numOfficers: INT NOT NULL, numOfficersPer100: FLOAT)

County-Arrest-Records(recordID: INT NOT NULL [PK], countyName: VARCHAR NOT NULL [PK, FK to County-Demographics.countyName], year: INT NOT NULL, capitalMurder: INT NOT NULL, violentCrimes: INT NOT NULL, crimesAgainstPersons: INT NOT NULL, crimesAgainstProperty: ITN NOT NULL, drugOffenses: INT NOT NULL)
```

## Process of Normalization: 
The table has a series of functional dependencies that all rely on the primary keys. The primary key of each table has an FD with its foreign key(s), if it has foreign key(s). There are no troublesome FDs because each piece of data only hinges on the primary key and there are no internal FDs that do not include the primary key. 

For CountyDemographics,  the `countyName` has an FD with each attribute, and the only relation those attributes have is with the primary key, making the table in 2NF. The table is also in 3NF since the minimal basis is the same as the starting FDs which means that any candidate key is already included in the minimal basis. This pattern is repeated for each table as there are no troublesome FDs in our schema.

For PoliceInfo, the primary key is comprised of both `agencyName` and `year`. These two attributes together determine the rest of the information of the remaining columns, so the primary key has a functional dependency with all attributes. Those attributes do not relate to one another in a meaningful way. Similar to CountyDemographics, there are no transitive dependencies, so the table is also in 3NF. 

For CountyArrestRecords schema there is both a `recordID` and a `countyName` because it is a weak entity set. However, the entire dataset hinges on the `countyName` with the `recordID` acting as a seperator. There is no relation between the `recordID` and the `countyName`, but every other attribute is linked to both `recordID` and `countyName` which means that there is no redundancy in the data.


**FDs**
* *Circuit Judicial:* primary key is `recordID` 
* *County Demographics:* primary key is `countyName`, foreign key is `districtName`
* *District Government:* primary key is `districtName`
* *Police Info:* primary keys are `year` and `agencyName`, foreign key is `countyName`
* *County Arrest Records:* primary keys are `recordID` and `countyName` (from CountyDemographics), foreign key is `countyName`

## Assumptions of Tables and Relations:
We assume that each county has many corresponding county arrest records, each with a distinguishing `recordID`. This is to see the trends of the county data over time as that may be better for understanding where crime may occur next. Analyzing trends of different regions can help us find counties where crime is likely to happen. We assume that the district governance has more impact on each region than county governance. This is why we indicate district party and representative levels rather than county representative levels. Furthermore we assume that the courts at the circuit level hold more sway than county or local courts. This is because the majority of impactful criminal cases are held at the circuit court level rather than with a county magistrate. 
However, our database centers demographic data at the county level. This is because we assume that the demographic data is more fine-grained in each county and influences crime rates more than the broad demographics in a district. This assumption was also influenced by the data that we found which was split at the county level rather than the district level. 

We assume that the demographic data at the county level can be used to find areas that are prone to crime. For example, areas with an increased poverty rate or a lower literacy rate could be indicators of areas with larger amounts of unrest and crime. It may also indicate an area that is not governed well which makes it easier to get away with crime. 

We keep police info on the assumption that the number of officers and ratio of officers to 1000 citizens has a correlation to the amount of crime that is prevented in the area. Places with more officers may have lower amounts of crime on average. 

## Description of Relationships/Cardinality:
Our five entities in our database are County Demographics, District Government Info, Circuit Judicial, Police Info, and County Arrest Records. The relationships are as follows.

**District Government Info to County Demographics:**
Each county is part of a district, but there can be multiple counties per district. Therefore, the relationship between District Government Info and County Demographics has a cardinality of one-to-many.

**County Demographics to Police Info:**
Each county contains several police agencies, so therefore the relationship between the County Demographics and the Police Info tables has a cardinality of one-to-many as well.

**County Arrest Records to County Demographics:**
Each county will have multiple arrest records, as it will have a new group of arrest records per year. County Arrest Records is a weak entity set as each county arrest record is uniquely identified only by the combination of its `recordID` and `countyName` that it is associated with. Therefore, the cardinality between County Arrest Records and County Demographics is many-to-one.

**Circuit Judicial Info to Court Demographics:**
Many counties have a higher-up appellate circuit court that adjudicates criminal cases. Therefore, for several counties there exists a circuit judicial court that processes cases and conducts trials, which describes a one-to-many cardinality between Circuit Judicial Info and County Demographics.
