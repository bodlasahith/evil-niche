# Advanced Queries

### Aggregate on Total Arrests per county *(Join & Aggregate)*

```sql
SELECT 
    arrest_records.countyName,
    SUM(arrest_records.capitalMurder) AS totalCapitalMurder,
    SUM(arrest_records.violentCrimes) AS totalViolentCrimes,
    SUM(arrest_records.crimesAgainstPersons) AS totalCrimesAgainstPersons,
    SUM(arrest_records.crimesAgainstProperty) AS totalCrimesAgainstProperty,
    SUM(arrest_records.drugOffenses) AS totalDrugOffenses,
    county.medianIncome,
    county.populationDensity
FROM 
    CountyArrestRecords arrest_records
JOIN
    CountyDemographics county ON arrest_records.countyName = county.countyName
GROUP BY 
    arrest_records.countyName
LIMIT 15;
```
![](images/advanced_queries/total_arrests_per_county_15.png)
![](images/advanced_queries/total_arrests_per_county_analysis.png)

### List all counties and their representatives with a poverty rate higher than the average poverty rate *(Aggregate & Subquery)*
```sql
SELECT county.countyName, district.representativeName, county.povertyRate
FROM CountyDemographics county
	JOIN DistrictGovernment district ON county.districtName = district.districtName
WHERE county.povertyRate > (
	SELECT AVG(povertyRate) 
FROM CountyDemographics
)
LIMIT 15;
```
![](images/advanced_queries/poverty_rate_15.png)
![](images/advanced_queries/poverty_rate_analysis.png)

### Circuits with the highest filing counts relative to the population of their associated counties *(Join & Aggregate)*
```sql
SELECT circuit.circuitID, SUM(circuit.filings) as TotalFilings, SUM(county.population) as TotalPopulation, (SUM(circuit.filings)/SUM(county.population)) as PerCapitaFilings
FROM CircuitJudicial circuit
	JOIN CountyDemographics county ON circuit.circuitID = county.circuitID
GROUP BY circuit.circuitID
ORDER BY PerCapitaFilings DESC
LIMIT 15;
```
![](images/advanced_queries/per_capita_filings_15.png)
![](images/advanced_queries/per_capita_filings_analysis.png)

### Calculate verdict percentages by circuit and year *(Join & Aggregate)*
```sql
SELECT 
    circuit.circuitID,
    circuit.year,
    county.districtName,
    TotalCharges,
    TotalConvictions,
    (TotalConvictions / TotalCharges) * 100 AS VerdictPercentage
FROM
    (SELECT 
        circuitID, 
        year, 
        SUM(charges) AS TotalCharges, 
        SUM(convictions) AS TotalConvictions
    FROM 
        CircuitJudicial
    GROUP BY 
        circuitID, year) AS circuit
JOIN 
    CountyDemographics AS county ON circuit.circuitID = county.circuitID
ORDER BY 
    circuit.circuitID, circuit.year
LIMIT 15;
```
![](images/advanced_queries/verdict_percentage_15.png)
![](images/advanced_queries/verdict_percentage_analysis.png)