**Python Programming: Basic Data Structures Study Guide**

This guide focuses on the fundamental data structures in Python: lists, tuples, and dictionaries.  It emphasizes a hands-on approach with clear examples and practice problems.


**1. Key Concepts:**

* **Lists:** Ordered, mutable (changeable) sequences of items.  Items can be of different data types. Defined using square brackets `[]`.

* **Tuples:** Ordered, immutable (unchangeable) sequences of items.  Similar to lists, but cannot be modified after creation. Defined using parentheses `()`.

* **Dictionaries:** Unordered collections of key-value pairs. Keys must be immutable (e.g., strings, numbers, tuples), while values can be of any data type. Defined using curly braces `{}`.


**2. Illustrative Examples:**

**Example 1: Lists**

```python
my_list = [1, "hello", 3.14, True]  # List with mixed data types
my_list.append(5)                  # Add an item to the end
my_list.insert(2, "world")         # Insert "world" at index 2
print(my_list)                     # Output: [1, 'hello', 'world', 3.14, True, 5]
print(my_list[1])                  # Access the element at index 1 (hello)
del my_list[0]                     # Delete the element at index 0
print(my_list)                     # Output: ['hello', 'world', 3.14, True, 5]
```


**Example 2: Tuples**

```python
my_tuple = (1, 2, 3)
print(my_tuple[0])  # Accessing elements works similarly to lists (Output: 1)
# my_tuple[0] = 4  # This will raise a TypeError because tuples are immutable
print(my_tuple)     # Output: (1, 2, 3)
```


**Example 3: Dictionaries**

```python
my_dict = {"name": "Alice", "age": 30, "city": "New York"}
print(my_dict["name"])  # Accessing values using keys (Output: Alice)
my_dict["age"] = 31      # Modifying values is allowed
my_dict["country"] = "USA" #Adding a new key-value pair
print(my_dict)          # Output: {'name': 'Alice', 'age': 31, 'city': 'New York', 'country': 'USA'}
```


**3. Practice Questions:**

**Question 1:** Create a list named `numbers` containing the integers from 1 to 5.  Then, add the number 6 to the end and print the list.

**Answer 1:**

```python
numbers = list(range(1, 6))
numbers.append(6)
print(numbers)  # Output: [1, 2, 3, 4, 5, 6]
```

**Question 2:** Create a tuple named `coordinates` containing the values (10, 20). Try to change the first element to 30. What happens?

**Answer 2:** You'll get a `TypeError` because tuples are immutable.

**Question 3:** Create a dictionary named `person` with keys "name" and "age", and assign appropriate values. Then, print the person's name.

**Answer 3:**

```python
person = {"name": "Bob", "age": 25}
print(person["name"])  # Output: Bob
```

**Question 4:**  What is the difference between a list and a tuple in Python? Give an example of when you might choose to use each.

**Answer 4:** Lists are mutable (changeable) while tuples are immutable (unchangeable).  Use lists when you need to modify the sequence of items; use tuples when you want to ensure data integrity and prevent accidental modification.


**Question 5:** How do you access the value associated with the key "city" in the following dictionary: `my_city = {"city": "London", "country": "UK"}`?

**Answer 5:** `my_city["city"]` (This will output "London")

This study guide provides a foundation for understanding basic Python data structures.  Remember to practice regularly to solidify your understanding.