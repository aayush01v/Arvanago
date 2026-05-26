#ifndef PLAYER_H
#define PLAYER_H

#include <string>
#include <iostream>
#include "Weapon.h"

class Enemy;

class Player {
private:
    std::string name;
    int health;
    int fuel;
    int scrap;
    Weapon inventory[3]; // array of objects

public:
    static int totalPlayersCreated; // static data member

    Player();
    Player(const std::string& name, int health, int fuel, int scrap);
    Player(const Player& other); // copy constructor
    ~Player();

    Player& operator=(const Player& other);

    void setName(const std::string& name); // uses this pointer
    std::string getName() const;
    int getHealth() const;
    int getFuel() const;
    int getScrap() const;
    Weapon getWeapon(int index) const;

    void setFuel(int newFuel);
    void spendScrap(int amount);
    void setWeapon(int index, const Weapon& weapon);

    void heal();      // function overloading
    void heal(int amount);

    void attack(Enemy& enemy);
    void takeDamage(int amount);
    void addScrap(int amount);
    bool isDead() const;
    void display() const;

    friend void showSecretPlayerData(const Player& player); // friend function
};

#endif
