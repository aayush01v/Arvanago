#ifndef GAMEOBJECT_H
#define GAMEOBJECT_H

#include "Vec2.h"

// Abstract class: cannot be instantiated because it has pure virtual functions.
class GameObject {
protected:
    Vec2 position; // protected member accessible by child classes

public:
    GameObject() : position(0, 0) {}
    GameObject(const Vec2& pos) : position(pos) {}

    // Pure virtual functions force derived classes to provide their own implementation.
    virtual void update() = 0;
    virtual void display() const = 0;

    virtual ~GameObject() {}
};

#endif
