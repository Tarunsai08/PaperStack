---
id: "cs-core-classes-objects"
kind: "primer"
subject: "cs-core"
slug: "classes-objects"
title: "A Cookie Cutter and Its Cookies"
subtitle: "Classes and objects in C++: the blueprint versus the instance, data members and member functions, where objects live in memory, what the this pointer is, and struct versus class"
track: "cs-oop"
track_order: 1
priority: "P0"
prerequisites: []
difficulty: "beginner"
read_minutes: 10
topics: ["oop", "c++", "classes", "objects", "this pointer"]
glossary:
  - term: "Class"
    definition: "A user-defined type that groups data members and the member functions that work on them; a blueprint, not a thing in memory."
  - term: "Object"
    definition: "An instance of a class: actual memory holding one set of the class's data members."
  - term: "Data member"
    definition: "A variable declared inside a class; each object has its own copy (unless it is static)."
  - term: "Member function"
    definition: "A function declared inside a class that operates on a particular object; its code exists once and is shared by all objects."
  - term: "this pointer"
    definition: "A hidden pointer passed to every non-static member function, pointing at the object the function was called on."
quiz:
  - q: "A class has one int member and ten member functions. With g++ on a typical 64-bit machine, what is sizeof an object?"
    options: ["44 bytes", "4 bytes: functions are not stored in each object", "84 bytes", "0 bytes"]
    answer: 1
    explain: "Member function code is shared; objects hold only data members. A struct with two ints and two methods measured 8 bytes."
  - q: "Inside asha.deposit(100), what does this point to?"
    options: ["The class BankAccount", "The object asha", "The deposit function", "Nothing; this is only for constructors"]
    answer: 1
    explain: "The compiler passes the address of the object the call was made on. The test program printed 1 for asha.self() == &asha."
  - q: "What is the only difference between struct and class in C++?"
    options: ["Structs cannot have functions", "Default access: struct members are public by default, class members are private by default", "Structs live on the stack", "Classes cannot be copied"]
    answer: 1
    explain: "Default inheritance access differs the same way. Otherwise they are identical."
cover_seed: "classes-objects"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.85
---

## The hook

A banking app has two million customers. Each has a name, a balance and a list of transactions, and each can deposit, withdraw and check a balance. Writing two million sets of variables is absurd; writing one set of loose global variables and functions means any line of code anywhere can change anyone's balance.

Object-oriented programming starts with one move: describe a customer account once, as a type, and then create as many accounts as you need from that description, each carrying its own data and the operations that belong with it. Interviewers open OOP rounds right here. Predict whether each of the two million accounts stores its own copy of the deposit function. (No: the code exists once; each object stores only its data.)

## The intuition

:::analogy
A **cookie cutter and its cookies**. The cutter (the class) defines the shape but is not a cookie and cannot be eaten. Every press makes a real cookie (an object) with its own dough, icing and sprinkles. Decorating one cookie does not change any other, and all of them were shaped by the same cutter.
:::

## Let's build it up

### A class is a blueprint

```cpp
#include <iostream>
#include <string>
using namespace std;

class BankAccount {
    string owner;
    long long balance = 0;          // every object gets its own copy
public:
    BankAccount(string name) : owner(name) {}

    void deposit(long long amount) {
        this->balance += amount;    // "this" points at the object the call was made on
    }
    long long getBalance() const { return balance; }
    const string& getOwner() const { return owner; }
    BankAccount* self() { return this; }
};

int main() {
    BankAccount asha("Asha"), ravi("Ravi");   // two objects from one class
    asha.deposit(500);
    ravi.deposit(200);
    asha.deposit(100);
    cout << asha.getOwner() << " " << asha.getBalance() << "\n";   // Asha 600
    cout << ravi.getOwner() << " " << ravi.getBalance() << "\n";   // Ravi 200
    cout << (asha.self() == &asha) << " " << (asha.self() == &ravi) << "\n";  // 1 0
}
```

The **[[class]]** `BankAccount` declares two **[[data member|data members]]** (owner, balance) and several **[[member function|member functions]]**. Each **[[object]]** (asha, ravi) holds its own owner and balance: Asha's deposits never touch Ravi's balance.

### Where things live

| Part | Stored | How many copies |
|---|---|---|
| Data members | inside each object | one per object |
| Member function code | in the program's code section | one, shared |
| Static data members | once, outside every object | one per class |

A struct with two ints and two member functions measured 8 bytes with g++: just the two ints. An empty class measured 1 byte, because every object must have a distinct address.

Wait, if the code for deposit exists only once, how does it know whose balance to change? That is the job of `this`.

### The this pointer

When you write `asha.deposit(100)`, the compiler effectively calls `deposit(&asha, 100)`: it passes the object's address as a hidden first argument named **[[this pointer|this]]**. Inside, `balance` means `this->balance`. The test program confirmed it: `asha.self()` returned exactly `&asha`. Writing `this->` explicitly is needed only when a parameter has the same name as a member, or to return the object itself (`return *this;` for chaining).

A `const` after a member function (`getBalance() const`) makes `this` a pointer to const, so the function promises not to modify the object and can be called on const objects.

### struct versus class

| | struct | class |
|---|---|---|
| Default member access | public | private |
| Default inheritance | public | private |
| Everything else | identical | identical |

By convention, struct is used for plain bundles of data and class for types that protect their data behind functions.

:::insight
A class is a type: a blueprint of data members and member functions. Each object is a separate block of memory holding its own data, while member function code is shared and finds the right object through the hidden this pointer.
:::

## A tiny example

Predict the output before reading the answer:

```cpp partial
BankAccount a("A"), b("B");
a.deposit(50);
b = a;            // copy every data member of a into b
b.deposit(10);
cout << a.getBalance() << " " << b.getBalance();
```

The output is 50 60. `b = a` copies a's data into b, but the two remain separate objects, so b's later deposit does not affect a.

:::warning
Common misconception: "an object contains its methods." Objects contain data only (plus, for classes with virtual functions, one hidden pointer to a table of functions). Methods are ordinary functions that receive the object's address as this. That is why sizeof ignores member functions.
:::

:::try-this
A class has members `int id; double score; char grade;` and five member functions. Roughly what is sizeof an object, and why is it not 13? (The data needs 4 + 8 + 1 = 13 bytes, but alignment pads it, typically to 24 bytes with g++ on 64-bit systems: double must start at a multiple of 8, and the total is rounded to a multiple of 8. The functions add nothing.)
:::

### Interview follow-ups

**"What is the difference between a class and an object?"** A class is a type definition; an object is an instance occupying memory, created from the class.

**"Can you call a member function on a null pointer?"** Calling a non-static member function through a null pointer is undefined behaviour, even if the function seems not to use this.

**"What is an empty class's size, and why?"** At least 1 byte, so that two distinct objects have distinct addresses.

## Where you'll see this again

Every OOP topic in this track builds on this one: access control in encapsulation, constructors and destructors, inheritance and virtual functions. The low-level design rounds in system design apply these ideas to whole systems, starting with [Lego Bricks With Standard Studs](article:system-design-oop-solid) and problems such as [Design a Parking Lot](article:system-design-parking-lot).

## Key takeaways

- A class is a blueprint defining data members and member functions, and an object is an instance occupying memory with its own copy of the data members.
- Member function code exists once and is shared by all objects, so sizeof an object counts only data members and padding.
- Every non-static member function receives a hidden this pointer to the object it was called on, which is how shared code changes the right object.
- A const member function receives a pointer to a const object and promises not to modify it.
- struct and class differ only in default access, public for struct and private for class.
