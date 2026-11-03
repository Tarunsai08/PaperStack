---
id: "cs-core-sql-interview-queries"
kind: "problem-walkthrough"
subject: "cs-core"
slug: "sql-interview-queries"
title: "Quiz Night: The SQL Questions Interviewers Always Ask"
subtitle: "Nth highest salary, duplicates, top earners per department with ties, employees above their managers, and consecutive-day streaks, each solved and checked"
track: "cs-dbms"
track_order: 8
priority: "P0"
prerequisites: ["cs-core-sql-advanced"]
difficulty: "intermediate"
read_minutes: 14
topics: ["dbms", "sql", "interview questions", "window functions", "gaps and islands"]
complexity: { time: "O(n log n)", space: "O(n)" }
practice_problems:
  - { name: "Second Highest Salary", platform: "LeetCode", url: "https://leetcode.com/problems/second-highest-salary/", difficulty: "Medium" }
  - { name: "Nth Highest Salary", platform: "LeetCode", url: "https://leetcode.com/problems/nth-highest-salary/", difficulty: "Medium" }
  - { name: "Duplicate Emails", platform: "LeetCode", url: "https://leetcode.com/problems/duplicate-emails/", difficulty: "Easy" }
  - { name: "Department Highest Salary", platform: "LeetCode", url: "https://leetcode.com/problems/department-highest-salary/", difficulty: "Medium" }
  - { name: "Employees Earning More Than Their Managers", platform: "LeetCode", url: "https://leetcode.com/problems/employees-earning-more-than-their-managers/", difficulty: "Easy" }
  - { name: "Consecutive Numbers", platform: "LeetCode", url: "https://leetcode.com/problems/consecutive-numbers/", difficulty: "Medium" }
glossary:
  - term: "Distinct rank"
    definition: "Ranking distinct values only, so ties do not consume positions; DENSE_RANK gives this directly."
  - term: "Gaps and islands"
    definition: "The family of problems about finding runs of consecutive values (islands) separated by missing values (gaps)."
  - term: "Group key trick"
    definition: "For consecutive dates, date minus its row number is constant within a run, so it can be used to GROUP BY each run."
  - term: "Tie handling"
    definition: "Deciding whether equal values share a position, both appear in results, or are broken by another column."
quiz:
  - q: "Distinct salaries are 150, 125, 120, 90, 85, 70, and two people earn 85. Which query returns the 3rd highest distinct salary?"
    options: ["ROW_NUMBER() = 3", "DENSE_RANK() = 3 (or DISTINCT … ORDER BY … LIMIT 1 OFFSET 2)", "RANK() = 3 always", "MAX(salary) − 3"]
    answer: 1
    explain: "DENSE_RANK ranks distinct values without gaps, giving 120. ROW_NUMBER counts people, not distinct salaries."
  - q: "Logins on 1, 2, 3 and 5 January. Dates minus row numbers give the same value for the 1st to 3rd and a different value for the 5th. What does that let you do?"
    options: ["Nothing", "Group each run of consecutive days, then count their length", "Sort by day", "Remove duplicates"]
    answer: 1
    explain: "Within a run, both the date and the row number increase by 1 each step, so their difference is constant: that difference is the run's group key."
  - q: "In Sales, Kabir and Ishan both earn the department's maximum of 85. What should 'highest earner per department' return for Sales?"
    options: ["Only Kabir", "Both Kabir and Ishan, unless the question says to break ties", "Neither", "The average"]
    answer: 1
    explain: "Comparing with MAX per department, or using DENSE_RANK = 1, keeps all tied top earners."
cover_seed: "sql-interview-queries"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.9
---

## The hook

Fundamentals rounds and online assessments reuse the same handful of SQL questions with new table names. Know them, and you can answer in two minutes; miss the twist in each, and a plausible query silently returns the wrong rows.

The twists are always the same three: ties, NULLs and "no such row". Predict which of the five classic questions below has a twist in all three. (The Nth highest salary. It has caught more candidates than any other SQL question.)

## The problem

Every answer below was executed on these tables, and the outputs shown are the actual results.

| id | name | dept | salary | manager_id | email |
|---|---|---|---|---|---|
| 1 | Asha | Eng | 120 | NULL | a@x.com |
| 2 | Ravi | Eng | 90 | 1 | r@x.com |
| 3 | Meera | Sales | 70 | 5 | m@x.com |
| 4 | Kabir | Sales | 85 | 5 | a@x.com |
| 5 | Zoya | Eng | 150 | NULL | z@x.com |
| 6 | Neel | Eng | 125 | 1 | r@x.com |
| 7 | Ishan | Sales | 85 | 5 | i@x.com |

Logins for the streak question: user 1 on 1, 2, 3 and 5 January; user 2 on 1, 3 and 4 January.

## The obvious approach

The obvious answers mostly work on clean data:

- 2nd highest: `ORDER BY salary DESC LIMIT 1 OFFSET 1`. Breaks when the top salary is shared: it returns the top value again.
- Top earner per department: `GROUP BY dept` with `MAX(salary)`, then try to add the name. You cannot select the name without grouping by it.
- Streaks: loop over days in application code. Fine for one user, painful for millions of rows.

## The key insight

:::analogy
A **quiz night of classic questions** rewards the team that reads the question exactly: "distinct" or not, "include ties" or not, "what if nobody qualifies". The SQL is short; the care is in the wording.
:::

Three ideas solve almost all of them:

1. **[[Distinct rank]]**: rank distinct values with DENSE_RANK (or DISTINCT before LIMIT/OFFSET).
2. **[[Tie handling]]**: compare with an aggregate (salary = MAX per group) or filter on DENSE_RANK = 1, which keeps all ties.
3. **[[Gaps and islands]]**: date minus ROW_NUMBER is constant inside a run of consecutive days, the **[[group key trick]]**.

## Walk through an example

### 1. Nth highest salary

Distinct salaries in order: 150, 125, 120, 90, 85, 70.

```sql
-- 3rd highest distinct salary
SELECT DISTINCT salary FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS dr FROM emp
) WHERE dr = 3;                                   -- 120

SELECT DISTINCT salary FROM emp
ORDER BY salary DESC LIMIT 1 OFFSET 2;            -- 120

-- 2nd highest without window functions
SELECT MAX(salary) FROM emp
WHERE salary < (SELECT MAX(salary) FROM emp);     -- 125
```

The three twists: duplicates (use DISTINCT or DENSE_RANK; ROW_NUMBER = 5 returns 85, the 5th *person*, not the 5th *salary*), and "no such row" (asking for the 10th highest should return NULL, not an empty result; wrap it as a scalar subquery: `SELECT (SELECT DISTINCT … OFFSET 9) AS s`).

### 2. Duplicate emails

```sql
SELECT email FROM emp GROUP BY email HAVING COUNT(*) > 1;   -- a@x.com, r@x.com
```

### 3. Highest earner per department, with ties

```sql
SELECT e.dept, e.name, e.salary FROM emp e
WHERE e.salary = (SELECT MAX(salary) FROM emp WHERE dept = e.dept);
-- Eng Zoya 150 | Sales Ishan 85 | Sales Kabir 85
```

The DENSE_RANK version (`PARTITION BY dept`, keep rank 1) gives the same three rows. Both keep the tie in Sales.

### 4. Employees earning more than their managers

```sql
SELECT e.name, e.salary, m.name, m.salary
FROM emp e JOIN emp m ON e.manager_id = m.id
WHERE e.salary > m.salary;                         -- Neel 125 > Asha 120
```

### 5. Consecutive-day streaks (gaps and islands)

| user | day | day as number | row_number | difference |
|---|---|---|---|---|
| 1 | Jan 1 | d | 1 | d − 1 |
| 1 | Jan 2 | d + 1 | 2 | d − 1 |
| 1 | Jan 3 | d + 2 | 3 | d − 1 |
| 1 | Jan 5 | d + 4 | 4 | d |

The difference is constant within each run, so grouping by it finds the islands: user 1 has Jan 1 to 3 (3 days) and Jan 5 (1 day); user 2 has Jan 1 (1 day) and Jan 3 to 4 (2 days). Users with a streak of at least 3 days: user 1.

:::try-this
Who has the 2nd highest salary within Eng, using DENSE_RANK with PARTITION BY dept? Predict it, including ties. (Eng salaries are 150, 125, 120, 90, so the 2nd distinct is 125: Neel. In Sales, rank 2 would be Meera at 70, because the two 85s share rank 1.)
:::

## The code

```pseudo
nth_highest_distinct(n):
    rank distinct salaries from high to low with no gaps
    return the salary with rank n, or NULL if none

streaks(logins, min_len):
    for each user, number their login days in date order (row_number)
    key = day_number - row_number           // same key within a consecutive run
    group by (user, key); keep groups with count >= min_len
```

```sql
WITH t AS (
  SELECT user_id, day,
         julianday(day) - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day) AS grp
  FROM logins
)
SELECT user_id, MIN(day) AS start_day, MAX(day) AS end_day, COUNT(*) AS days
FROM t GROUP BY user_id, grp
HAVING COUNT(*) >= 3;                              -- user 1: Jan 1 to Jan 3, 3 days
```

(`julianday` is SQLite's date-to-number function; other databases use date subtraction or DATEDIFF. If a user can log in twice on one day, select DISTINCT days first.)

## Complexity

Window functions and GROUP BY typically sort or hash the rows: **O(n log n)** time and **O(n)** extra space for n rows, versus O(n²) for self-join tricks such as "count employees with higher salary than me". With an index on the ordering columns, the sort can sometimes be avoided.

## Common mistakes

:::warning
Common misconception: "LIMIT 1 OFFSET N−1 gives the Nth highest salary." Without DISTINCT, a shared salary takes several positions, so you get a repeated value or skip one; and when fewer than N salaries exist, the result is empty instead of NULL. Use DISTINCT (or DENSE_RANK) and wrap it to return NULL.
:::

- **ROW_NUMBER for "Nth highest salary"**, which counts people, not salaries.
- **Dropping ties** in "top per department" by using ROW_NUMBER = 1.
- **Selecting non-grouped columns** with MAX in a GROUP BY.
- **Duplicate login rows** breaking the islands trick; deduplicate days first.
- **Comparing with NULL managers**: an inner self join correctly skips employees without managers; a left join would need care.

### Interview follow-ups

**"Running total of salaries by hire date?"** SUM(salary) OVER (ORDER BY hire_date), as in [A Leaderboard Computed Inside the Query](article:cs-core-sql-advanced).

**"Delete duplicate emails, keeping the lowest id?"** DELETE FROM emp WHERE id NOT IN (SELECT MIN(id) FROM emp GROUP BY email). Here NOT IN is safe because MIN(id) is never NULL.

**"Departments with no employees?"** Anti join with NOT EXISTS, as explained in [Matching Guest Lists From Two Parties](article:cs-core-sql-joins).

## Practice problems

Start with **Duplicate Emails** and **Employees Earning More Than Their Managers** (group-by and self join). Then **Second Highest Salary** and **Nth Highest Salary**, paying attention to the NULL requirement. **Department Highest Salary** tests tie handling, and **Consecutive Numbers** is a gaps-and-islands warm-up.

## Key takeaways

- For the Nth highest value, rank distinct values with DENSE_RANK or DISTINCT with LIMIT/OFFSET, and return NULL when it does not exist.
- Find duplicates with GROUP BY … HAVING COUNT(*) > 1.
- For "top per group", compare with the group's MAX or keep DENSE_RANK = 1, so ties are not lost.
- Self joins answer employee-versus-manager questions by joining the table to itself on manager_id.
- For consecutive streaks, date minus ROW_NUMBER is constant within a run, so grouping by it finds each run and its length.
