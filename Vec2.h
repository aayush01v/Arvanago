#ifndef VEC2_H
#define VEC2_H

#include <iostream>

class Vec2 {
private:
    int x;
    int y;

public:
    Vec2();
    Vec2(int x, int y);
    Vec2(const Vec2& other); // copy constructor

    Vec2 operator+(const Vec2& other) const; // operator overloading
    Vec2& operator=(const Vec2& other);      // object assignment

    int getX() const;
    int getY() const;

    friend std::ostream& operator<<(std::ostream& os, const Vec2& vec);
};

#endif
