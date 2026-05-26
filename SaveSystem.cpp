#include "SaveSystem.h"
#include "GameException.h"
#include <fstream>

void SaveSystem::savePlayer(const Player& player) {
    std::ofstream outFile("savegame.txt"); // file opening
    if (!outFile.is_open()) {
        throw GameException("Failed to open save file for writing.");
    }

    outFile << player.getName() << "\n";
    outFile << player.getHealth() << " " << player.getFuel() << " " << player.getScrap() << "\n";

    outFile.close(); // file closing
}

void SaveSystem::loadPlayer(Player& player) {
    std::ifstream inFile("savegame.txt"); // file opening
    if (!inFile.is_open()) {
        throw GameException("Failed to open save file for reading.");
    }

    std::string name;
    int health, fuel, scrap;

    std::getline(inFile, name);
    inFile >> health >> fuel >> scrap;

    if (name.empty() || inFile.fail()) {
        inFile.close();
        throw GameException("Invalid save file data.");
    }

    Player loaded(name, health, fuel, scrap);
    player = loaded; // assignment operator

    inFile.close();
}
