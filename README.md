# Cosmic OOP Arena (C++17 Console Game)

Compile:

```bash
g++ -std=c++17 *.cpp -o CosmicOOPArena
```

Run:

```bash
./CosmicOOPArena
```

## Concept-to-Code Mapping

| # | C++ Concept | Where Used |
|---|-------------|------------|
| 1 | class and object | All classes; objects in `Game` and local demos |
| 2 | constructors | `Player`, `Weapon`, `Vec2`, enemy classes |
| 3 | parameterized constructors | `Vec2(int,int)`, `Weapon(string,int,int)`, `Player(...)` |
| 4 | destructors | `Player::~Player`, `Enemy::~Enemy`, `GameObject::~GameObject` |
| 5 | copy constructor | `Vec2(const Vec2&)`, `Weapon(const Weapon&)`, `Player(const Player&)` |
| 6 | object assignment | `Vec2::operator=`, `Weapon::operator=`, `Player::operator=`, load flow |
| 7 | friend function | `showSecretPlayerData(const Player&)`, `operator<<` in `Vec2` and `Weapon` |
| 8 | static data member | `Player::totalPlayersCreated`, `Enemy::totalEnemiesCreated` |
| 9 | array of objects | `Weapon inventory[3]` in `Player`, `availableWeapons[3]` in `Shop` |
| 10 | pointer to object | `Enemy* enemy` in `Game::startBattle` |
| 11 | this pointer | `Player::setName` |
| 12 | reference parameter | `Player::attack(Enemy& enemy)`, enemy attacks player by reference |
| 13 | dynamic allocation new/delete | `new NormalEnemy/...` and `delete enemy` in battle |
| 14 | operator overloading | `Vec2::operator+`, `Vec2::operator=`, `Weapon::operator==`, `Weapon::operator+` |
| 15 | function overloading | `Player::heal()` and `Player::heal(int)` |
| 16 | inline function | `Game::printDivider` in `Game.h` |
| 17 | inheritance | `Enemy : public GameObject`, enemy child classes |
| 18 | protected members | `GameObject::position`, `Enemy` protected stats |
| 19 | multiple inheritance | `BossEnemy : public Enemy, public RewardGiver` |
| 20 | virtual functions | `Enemy::display`, `Enemy::attack`, `GameObject` virtual interface |
| 21 | pure virtual functions | `GameObject::update/display`, `Enemy::attack/update`, `RewardGiver::bonusReward` |
| 22 | abstract class | `GameObject`, `Enemy`, `RewardGiver` |
| 23 | early binding | `player.attack(*enemy)` comment in `Game::startBattle` |
| 24 | late binding | `enemy->attack(player)` and `enemy->update()` via base pointer |
| 25 | exception handling | `try/catch` in `Game::run`, `throw GameException` |
| 26 | fstream file handling | `SaveSystem.cpp` uses `ofstream` and `ifstream` |
| 27 | opening and closing files | `is_open()`, `close()` in `SaveSystem` |
| 28 | reading and writing text files | `savegame.txt` read/write in `SaveSystem` |

