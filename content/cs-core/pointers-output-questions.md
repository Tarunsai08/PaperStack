---
id: "cs-core-pointers-output-questions"
kind: "primer"
subject: "cs-core"
slug: "pointers-output-questions"
title: "Street Addresses Versus the Houses at Them"
subtitle: "Pointer and output questions as asked in OAs: arrays decaying to pointers, pointer arithmetic, pre and post increment, references versus pointers, signed and unsigned surprises, integer promotion, and how to spot undefined behaviour"
track: "cs-oop"
track_order: 17
priority: "P1"
prerequisites: ["cs-core-classes-objects"]
difficulty: "intermediate"
read_minutes: 13
topics: ["c++", "pointers", "output questions", "undefined behaviour", "references", "integer promotion"]
glossary:
  - term: "Pointer"
    definition: "A variable holding a memory address; *p reads or writes the object at that address."
  - term: "Array decay"
    definition: "An array expression turning into a pointer to its first element in most contexts, including when passed to a function."
  - term: "Pointer arithmetic"
    definition: "Adding an integer to a pointer moves it by that many elements (not bytes); subtracting two pointers into one array gives the element distance."
  - term: "Reference"
    definition: "An alias for an existing object; it must be initialised, cannot be reseated, and is used without the * operator."
  - term: "Integer promotion"
    definition: "The rule that char and short operands are converted to int before arithmetic."
  - term: "Undefined behaviour"
    definition: "Code whose behaviour the C++ standard does not define, such as modifying a variable twice without sequencing; any output, or none, is possible."
quiz:
  - q: "int a[5]; void f(int arr[]) prints sizeof(arr). On a 64-bit build, what is printed, and what does sizeof(a) give in main?"
    options: ["20 and 20", "8 in f (a pointer) and 20 in main (5 ints of 4 bytes)", "4 and 20", "20 and 8"]
    answer: 1
    explain: "The array decays to int* when passed; g++ even warns. The test program printed 20 in main and 8 inside the function."
  - q: "int x = 5; int y = x++ + 10; int z = ++x + 10; What are x, y and z?"
    options: ["7, 16, 17", "7, 15, 17", "6, 15, 16", "7, 15, 18"]
    answer: 1
    explain: "y uses the old x (5), then x becomes 6; ++x makes x 7 before use, so z = 17. Printed: 7 15 17."
  - q: "int s = -1; unsigned u = 1; Is s < u true?"
    options: ["Yes", "No: s is converted to unsigned, becoming a huge value", "Compile error", "Undefined behaviour"]
    answer: 1
    explain: "Mixed signed and unsigned comparisons convert the signed side. The program printed 'not less', and g++ -Wall warned about it."
cover_seed: "pointers-output-questions"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.7
---

## The hook

An online assessment shows six lines of C++ and four possible outputs. You have ninety seconds. The code is full of `*p++`, an array passed to a function, and a comparison between an int and an unsigned. Two of the options look right. One of them is the trap.

These questions test whether you know what the language actually does, not what it looks like it does. And some are designed to have *no* correct output, because the code has undefined behaviour. Every output claimed below came from compiling and running the snippet with g++ on a 64-bit Linux machine. Predict the output of `sizeof` on an array parameter before reading on. (The size of a pointer, 8, not the array.)

## The intuition

:::analogy
A pointer is a **street address**; the object is **the house at it**. Writing the address on a new slip of paper does not copy the house; going to the address (dereferencing) lets you repaint the house. Moving "3 houses down the street" means three houses, however wide each house is. And a reference is a nickname for one particular house: it cannot be moved to another house.
:::

## Let's build it up

The ten snippets, compiled as one program:

```cpp
#include <iostream>
using namespace std;

void sizeInFunction(int arr[]) { cout << "2: " << sizeof(arr) << "\n"; }   // arr is really int* (g++ warns)
void byValue(int x) { x = 99; }
void byRef(int& x) { x = 99; }
void byPtr(int* x) { *x = 77; }

int main() {
    int a[5] = {10, 20, 30, 40, 50};
    cout << "1: " << sizeof(a) << " " << *(a + 2) << " " << 2[a] << "\n";
    sizeInFunction(a);

    int* p = a;
    p += 3;
    cout << "3: " << *p << " " << (p - a) << " " << *(p - 1) << "\n";

    int x = 5;
    int y = x++ + 10;             // uses old x
    int z = ++x + 10;             // uses new x
    cout << "4: " << x << " " << y << " " << z << "\n";

    int m = 1, n = 1;
    byValue(m); byRef(n);
    cout << "5: " << m << " " << n << "\n";

    int q = 1; byPtr(&q);
    cout << "6: " << q << "\n";

    unsigned int u = 1;
    int s = -1;
    cout << "7: " << (s < u ? "less" : "not less") << "\n";   // -1 converted to unsigned

    char c1 = 100, c2 = 100;
    auto sum = c1 + c2;           // promoted to int
    cout << "8: " << sum << " " << sizeof(sum) << "\n";

    const char* str = "hello";
    cout << "9: " << *str << " " << *(str + 1) << " " << str + 1 << "\n";

    int arr2[3] = {1, 2, 3};
    int* r = arr2;
    int first = *r++;             // *(r++): read arr2[0], then move r
    int second = (*r)++;          // read arr2[1], then increment the value it points to
    cout << "10: " << first << " " << second << " " << arr2[1] << " " << *r << "\n";
}
```

| # | Output | Why |
|---|---|---|
| 1 | 20 30 30 | sizeof the array is 5 × 4 bytes; `*(a + 2)` is a[2]; `2[a]` means `*(2 + a)`, the same element |
| 2 | 8 | the parameter `int arr[]` is really `int*` (**[[array decay]]**), so sizeof gives the pointer size |
| 3 | 40 3 30 | **[[pointer arithmetic]]** moves by elements: p points at a[3]; p − a = 3 elements |
| 4 | 7 15 17 | x++ yields the old value (5) then increments; ++x increments first (to 7) |
| 5 | 1 99 | by value changes a copy; by **[[reference]]** changes the caller's variable |
| 6 | 77 | through a **[[pointer]]**, the function writes the caller's variable |
| 7 | not less | −1 is converted to unsigned (4294967295 for 32-bit unsigned), which is not less than 1 |
| 8 | 200 4 | **[[integer promotion]]**: chars are promoted to int before adding, so no overflow, and sum is an int |
| 9 | h e ello | `*str` is a char; `str + 1` is a `const char*`, which cout prints as a string from there |
| 10 | 1 2 3 3 | `*r++` is `*(r++)`: reads 1, moves r; `(*r)++` reads 2 and bumps arr2[1] to 3 |

Wait, why does snippet 7 not just compare −1 with 1? When a signed and an unsigned int of the same size meet, the usual arithmetic conversions turn the signed one into unsigned. −1 wraps to the largest unsigned value. g++ -Wall flagged it: "comparison of integer expressions of different signedness". This exact pattern bites in `for (int i = 0; i < v.size() - 1; ...)` when v is empty: `v.size() - 1` wraps to a huge number.

### Precedence you must know

| Expression | Means |
|---|---|
| `*p++` | `*(p++)`: use the value at p, then advance p |
| `(*p)++` | increment the value at p |
| `*++p` | advance p, then use the new value |
| `++*p` | increment the value at p, then use it |

### When there is no right answer

```cpp partial
int i = 1;
i = i++ + ++i;      // undefined behaviour: i modified twice without sequencing
```

g++ warns: "operation on 'i' may be undefined". The standard places no requirement on what this prints; different compilers, flags or even nearby code changes can give different results. In an OA, the correct choice for such code is "undefined behaviour" (or "compiler dependent" if that is the closest option), never a specific number. Other common **[[undefined behaviour]]**: reading an uninitialised variable, signed integer overflow, dereferencing a dangling or null pointer, and indexing past an array's end.

:::insight
Arrays decay to pointers when passed, so sizeof inside a function gives the pointer size; pointer arithmetic counts elements; post-increment yields the old value; references alias and pointers address; mixed signed and unsigned comparisons convert to unsigned; small integers promote to int. When a snippet modifies the same variable twice without sequencing, the honest answer is undefined behaviour.
:::

## A tiny example

Predict before checking: `int b[4] = {1, 2, 3, 4}; int* p = b + 1; cout << p[1] << " " << *p + 1 << " " << *(p + 1) + 1;` (p points at b[1] = 2. p[1] is b[2] = 3. `*p + 1` is 2 + 1 = 3, since * binds tighter than +. `*(p + 1) + 1` is 3 + 1 = 4. Output: 3 3 4.)

:::warning
Common misconception: "if it printed 7 on my machine, 7 is the answer." For undefined behaviour, one compiler's output proves nothing; the same code can print something else with -O2 or another compiler. For defined code, run it; for undefined code, the answer is that there is no guaranteed output.
:::

:::try-this
`char c = 200;` on a platform where char is signed 8-bit, then `cout << (int)c;`. What prints, and is it defined? (The value 200 does not fit in a signed 8-bit char, whose range is −128 to 127; the conversion is implementation-defined before C++20 and wraps modulo 256 from C++20, giving −56. Typical compilers print −56 either way, but it is a platform question: char may be unsigned on some platforms, printing 200.)
:::

### Interview follow-ups

**"Pointer versus reference?"** A pointer can be null, reseated and has its own address; a reference must be bound at creation, cannot be reseated, and acts as the object itself.

**"What is a null pointer versus a dangling pointer?"** Null points to nothing and can be checked; dangling points to memory that has been freed or gone out of scope, and cannot be detected by looking at it.

**"Why is `i < v.size() - 1` dangerous?"** size() is unsigned; for an empty vector, size() − 1 wraps to a huge value and the loop runs out of bounds.

## Where you'll see this again

These rules underlie every C and C++ OA and the memory bugs in [A Desk You Clear Daily Versus a Storage Unit You Must Empty](article:cs-core-memory-model-cpp). Objects and the this pointer, itself a pointer, are in [A Cookie Cutter and Its Cookies](article:cs-core-classes-objects).

## Key takeaways

- An array passed to a function decays to a pointer, so sizeof inside the function gives the pointer size, 8 bytes on a 64-bit build, not the array size.
- Pointer arithmetic moves by whole elements, and subtracting two pointers into the same array gives the number of elements between them.
- Post-increment yields the old value and pre-increment the new one, and *p++ means read through p and then advance p.
- Comparing a signed int with an unsigned converts the signed value, so −1 is not less than 1u, and char operands are promoted to int before arithmetic.
- Modifying a variable twice without sequencing, signed overflow and invalid pointer use are undefined behaviour, for which no output is guaranteed.
