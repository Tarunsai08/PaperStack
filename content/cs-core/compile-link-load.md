---
id: "cs-core-compile-link-load"
kind: "deep-dive"
subject: "cs-core"
slug: "compile-link-load"
title: "Writing a Book, Binding It and Shelving It"
subtitle: "From source code to a running program: preprocessing, compiling, assembling, linking and loading, traced on a two-file program, with symbols, 'undefined reference' errors, and static versus dynamic libraries"
track: "cs-architecture"
track_order: 3
priority: "P1"
prerequisites: ["cs-core-number-representation"]
difficulty: "intermediate"
read_minutes: 13
topics: ["compilers", "linker", "loader", "static library", "dynamic library", "build process"]
glossary:
  - term: "Preprocessor"
    definition: "The first stage, which handles #include, #define and conditional compilation by plain text substitution."
  - term: "Object file"
    definition: "The machine code for one source file (.o), with a symbol table listing what it defines and what it still needs."
  - term: "Linker"
    definition: "The tool that combines object files and libraries, resolving each undefined symbol to a definition, and produces an executable."
  - term: "Static library"
    definition: "An archive of object files (.a) whose needed parts are copied into the executable at link time."
  - term: "Shared library"
    definition: "A library (.so on Linux, .dll on Windows) loaded at run time and shared between programs, so the executable only records that it needs it."
  - term: "Loader"
    definition: "The part of the operating system that maps an executable into memory, loads its shared libraries, resolves their symbols and starts it."
quiz:
  - q: "main.cpp calls cube(3), declared in a header, but you link only main.o. What error do you get, and from which stage?"
    options: ["Compile error: cube not declared", "Linker error: undefined reference to cube(int)", "Runtime crash", "Preprocessor error"]
    answer: 1
    explain: "The header's declaration satisfied the compiler; the definition was missing at link time. g++ printed: undefined reference to `cube(int)'."
  - q: "#define SQUARE(x) ((x) * (x)) is used as SQUARE(4). When is it replaced, and by what?"
    options: ["At run time by a function call", "By the preprocessor, before compilation, with the text ((4) * (4))", "By the linker", "Never"]
    answer: 1
    explain: "g++ -E showed the expanded line containing ((4) * (4))."
  - q: "A program linked against a shared library fails to start with 'cannot open shared object file'. Which component is complaining?"
    options: ["The compiler", "The dynamic loader, at program start", "The preprocessor", "The assembler"]
    answer: 1
    explain: "The executable built fine; the loader could not find libmathx.so until LD_LIBRARY_PATH pointed at it."
cover_seed: "compile-link-load"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.68
---

## The hook

You type `g++ main.cpp mathx.cpp -o app` and a program appears. That one command actually ran four different tools in a row, and when something goes wrong, the error message comes from one of them. "Undefined reference" and "cannot open shared object file" are two of the most common errors new C++ programmers hit, and they come from stages most people never knew existed.

Following one small program through every stage turns those messages from mysteries into one-line diagnoses. Predict which stage complains when a function is declared in a header but its .cpp file is never compiled in. (The linker, not the compiler.)

## The intuition

:::analogy
**Writing a book, binding it and shelving it.** The author's draft has notes like "insert the standard disclaimer here" (preprocessing fills them in). Each chapter is typeset separately (compiling and assembling), with notes like "see the table in chapter 5". The binder puts the chapters together and turns every cross-reference into a real page number (linking). Finally, the librarian shelves the book and fetches any companion volumes it refers to (loading).
:::

## How it works

The example: a header with a macro and a declaration, a file that defines cube, and main.

```cpp partial
// mathx.h
#pragma once
#define SQUARE(x) ((x) * (x))
int cube(int x);

// mathx.cpp
#include "mathx.h"
int cube(int x) { return x * x * x; }

// main.cpp
#include <cstdio>
#include "mathx.h"
int main() { std::printf("%d %d\n", SQUARE(4), cube(3)); }   // prints 16 27
```

```mermaid
flowchart LR
  S[main.cpp] --> P[Preprocess: includes and macros expanded]
  P --> C[Compile to assembly main.s]
  C --> A[Assemble to object file main.o]
  A --> L[Link with mathx.o and libraries]
  L --> E[Executable app]
  E --> LD[Loader maps it into memory and starts main]
```

### 1. Preprocessing

The **[[preprocessor]]** does text substitution: it pastes in included headers and expands macros. `g++ -E main.cpp` showed the last line as `std::printf("%d %d\n", ((4) * (4)), cube(3));`. SQUARE no longer exists; the compiler never sees it.

### 2. Compiling and 3. assembling

The compiler translates one preprocessed file into assembly (`g++ -S`), checking types against declarations; the assembler turns it into an **[[object file]]** (`g++ -c`). The assembly for main contained `call _Z4cubei@PLT`: a call to cube whose address is not known yet. (`_Z4cubei` is the mangled name for `cube(int)`, which is how C++ encodes parameter types for overloading.)

The symbol tables, shown with `nm -C`:

| File | Symbol | Meaning |
|---|---|---|
| main.o | T main | defined here (in the text section) |
| main.o | U cube(int) | used here, undefined: someone else must provide it |
| main.o | U printf | undefined: will come from the C library |
| mathx.o | T cube(int) | defined here |

### 4. Linking

The **[[linker]]** combines object files and libraries, matching every U to a T. Linking main.o alone failed: "undefined reference to `cube(int)'". Linking main.o with mathx.o produced a program that printed 16 27.

Wait, why did the compiler accept main.cpp if cube's code was missing? Because the header declared `int cube(int)`: that is all the compiler needs to check the call and emit it. Finding the body is the linker's job, so "undefined reference" means "declared, used, but never defined in anything you linked": a missing .cpp or library on the command line, or a signature mismatch between declaration and definition.

### Static versus shared libraries

| | **[[Static library]]** (libmathx.a) | **[[Shared library]]** (libmathx.so) |
|---|---|---|
| Built with | `ar rcs libmathx.a mathx.o` | `g++ -shared -fPIC mathx.cpp -o libmathx.so` |
| At link time | needed object code copied into the executable | executable records "needs libmathx.so" |
| At run time | nothing extra to find | the loader must find the .so |
| Updating the library | relink every program | replace the .so; programs pick it up |
| Memory | each program has its own copy | one copy in memory shared by all programs |

Both versions printed 16 27. The dynamic one first failed with "error while loading shared libraries: libmathx.so: cannot open shared object file", and `ldd` listed "libmathx.so => not found"; with `LD_LIBRARY_PATH=.` it ran.

### 5. Loading

When you run a program, the OS **[[loader]]** creates a process, maps the executable's code and data into its virtual address space, and hands control to the dynamic linker, which loads each needed shared library, resolves symbols (often lazily, on first call, through the PLT seen in `cube@PLT`), and jumps to the program's entry point, which eventually calls main.

:::insight
Building a C++ program is four separate steps: the preprocessor substitutes text, the compiler checks one file at a time against declarations, the assembler emits object files with defined and undefined symbols, and the linker resolves every undefined symbol. At run time, the loader maps the program and its shared libraries into memory. Each error message belongs to exactly one of these steps.
:::

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Static linking | One self-contained file; no missing-library errors | Bigger executables; security fixes need relinking |
| Dynamic linking | Smaller executables, shared memory, library updates without rebuilding | "Not found" and version mismatch problems at run time |
| Macros | Text substitution with no call cost | No type checking; surprising expansions |
| inline or constexpr functions | Type-safe, often just as fast | Must be visible in headers |

:::warning
Common misconception: "including a header adds the library's code to my program." A header usually contains only declarations, which satisfy the compiler. The code itself lives in a .cpp file, object file or library that must be compiled or linked in; otherwise the linker reports an undefined reference.
:::

:::try-this
`#define DOUBLE(x) x + x` and then `int y = 3 * DOUBLE(2);`. What is y, and why? (The preprocessor produces `3 * 2 + 2`, which is 8, not 12, because it is pure text substitution. Parenthesising the macro as `((x) + (x))`, or using an inline function, fixes it.)
:::

## What can go wrong

- **Undefined reference**: a missing source file or library at link time, a declaration that does not match the definition, or a C function used from C++ without extern "C".
- **Multiple definition**: a non-inline function or global defined in a header included by several files.
- **Missing shared libraries** at run time, or the wrong version found first.
- **Macro surprises** from unparenthesised arguments or arguments with side effects.
- **Library order** on some linkers: a library listed before the object files that need it may be skipped.

### Interview follow-ups

**"What is name mangling?"** Encoding a function's parameter types (and namespaces) into its symbol name, such as _Z4cubei, so overloaded C++ functions get distinct symbols. extern "C" turns it off for C compatibility.

**"What is the difference between a declaration and a definition?"** A declaration introduces a name and type; a definition also provides the body or storage. There can be many declarations but only one definition (the one-definition rule).

**"What does -fPIC mean?"** Position-independent code: machine code that works at any address, required for shared libraries that may be loaded anywhere.

## In the real world

Build systems such as Make, CMake and Bazel orchestrate these stages, recompiling only changed files and linking the results. How the OS loader then turns the executable into a process is introduced in [The Hotel Manager Every Program Secretly Reports To](article:cs-core-what-an-os-does).

## Further reading

- John Levine, *Linkers and Loaders*.
- Randal Bryant and David O'Hallaron, *Computer Systems: A Programmer's Perspective*, chapter 7, "Linking".

## Key takeaways

- Building a C++ program runs the preprocessor, the compiler, the assembler and the linker, and running it involves the loader.
- The preprocessor performs plain text substitution for includes and macros before the compiler sees the code.
- Each object file lists the symbols it defines and the ones it still needs, and the linker matches every undefined symbol to a definition or reports an undefined reference.
- Static libraries are copied into the executable at link time, while shared libraries are found and loaded at run time and shared between programs.
- The loader maps the executable and its shared libraries into the process's memory, resolves remaining symbols and starts the program.
