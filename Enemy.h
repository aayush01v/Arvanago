#ifndef ENEMY_H
#define ENEMY_H

#include <string>
#include <iostream>
#include "GameObject.h"

class Player;

class Enemy : public GameObject {
protected:
    std::string type;
    int health;
    int damage;
    int rewardScrap;

public:
    static int totalEnemiesCreated;

    Enemy(const std::string& type, int health, int damage, int rewardScrap, const Vec2& pos);
    Enemy(const Enemy& other);

    virtual void attack(Player& player) = 0;
    virtual void update() = 0;
    virtual void display() const override;

    void takeDamage(int amount);
    bool isDead() const;
    int getRewardScrap() const;

    virtual ~Enemy();
};

class RewardGiver {
public:
    virtual int bonusReward() const = 0;
    virtual ~RewardGiver() {}
};

class NormalEnemy : public Enemy {
public:
    NormalEnemy();
    void attack(Player& player) override;
    void update() override;
};

class FastEnemy : public Enemy {
public:
    FastEnemy();
    void attack(Player& player) override;
    void update() override;
};

class TankEnemy : public Enemy {
public:
    TankEnemy();
    void attack(Player& player) override;
    void update() override;
};

// Multiple inheritance: BossEnemy inherits Enemy and RewardGiver.
class BossEnemy : public Enemy, public RewardGiver {
public:
    BossEnemy();
    void attack(Player& player) override;
    void update() override;
    int bonusReward() const override;
};

#endif
