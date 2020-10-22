# Pascal magic

High-quality Pascal highlighting made by an actual Pascal programmer


This extension provides snippets and extensive highlighting support for the Pascal programming language.

![screenshot](https://raw.githubusercontent.com/ALANVF/vscode-pascal-magic/master/assets/example.png)


## Contributing

Please edit the [REON](https://github.com/ALANVF/reon) files instead of the JSON files


## Known issues

- Syntax highlighting does NOT like macros
- Preprocessor directives do not play well with semicolons


## Not yet implemented / TODO

- `set` constants
- Complex constant expressions (partially done)
- `objcprotocol` declarations
- `objccategory` declarations
- Custom attributes
- Freestanding generic routines
	- Need to add support for calls without `specialize`, but this is otherwise finished
- This syntax: `function IEqualityComparer<T>.GetHashCode = GetHashCode2;`
- Nested comments
- Highlight type on right-hand side of `is` and `as` expressions
- Highlight generic args in exprs, even if we don't know if it's a type or routine
- Constant expressions in interface IDs should be allowed
- Wtf is a `dispinterface`?
	- Side note: dispid also seems to be an attribute that exists
- `cppclass` (idk what it is, but it's definitely a thing)
- Codepage syntax for `string` types
- Better highlighting for preprocessor directives