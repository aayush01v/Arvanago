#ifndef SAVESYSTEM_H
#define SAVESYSTEM_H

#include "Player.h"

class SaveSystem {
public:
    static void savePlayer(const Player& player);
    static void loadPlayer(Player& player);
};

#endif
