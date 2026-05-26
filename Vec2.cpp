#include "Vec2.h"

Vec2::Vec2() : x(0), y(0) {}

Vec2::Vec2(int x, int y) : x(x), y(y) {}

Vec2::Vec2(const Vec2& other) : x(other.x), y(other.y) {}

Vec2 Vec2::operator+(const Vec2& other) const {
    return Vec2(x + other.x, y + other.y);
}

Vec2& Vec2::operator=(const Vec2& other) {
    if (this != &other) {
        x = other.x;
        y = other.y;
    }
    return *this;
}

int Vec2::getX() const { return x; }
int Vec2::getY() const { return y; }

std::ostream& operator<<(std::ostream& os, const Vec2& vec) {
    os << "(" << vec.x << ", " << vec.y << ")";
    return os;
}
