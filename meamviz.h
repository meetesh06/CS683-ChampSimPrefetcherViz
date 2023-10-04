// 
// Author: _mee_
// GHUB: meetesh06
// 

#pragma once
#include <string>
#include <fstream>
#include <iostream>
#include "memory_class.h"

class MeamViz {
  public:
  MeamViz(std::string path) {
    logFile.open(path, std::ios::out);    
    if (!logFile){
      std::cout<<"Unable to open the logfile!!" << std::endl;
      exit(1);    
    }
    logFile << "CYCLE, EVENT_NAME, CACHE_NAME, ADDR, IP, CACHE_HIT, TYPE" << std::endl;
  }

  void logCachePrefetchEvent(
    const uint64_t & currentCycle, const std::string & cacheName,
    const uint64_t & addr
    ) {
      logFile << currentCycle << ",";
      logFile << "PREFETCH_SUCCESS" << ",";
      logFile << cacheName << ",";
      logFile << addr << ",";
      logFile << 0 << ",";
      logFile << 0 << ",";
      logFile << 0 << std::endl;
  }

  void logCacheOperateEvent(
    const uint64_t & currentCycle, const std::string & cacheName, 
    const uint64_t & addr, const uint64_t & ip, const uint8_t & cache_hit,
    const uint8_t & type) {
      logFile << currentCycle << ",";
      logFile << "CACHE_OPERATE" << ",";
      logFile << cacheName << ",";
      logFile << addr << ",";
      logFile << ip << ",";
      logFile << std::to_string(cache_hit) << ",";
      logFile << getCacheEventTypeString(type) << std::endl;
  }

  ~MeamViz() { 
    std::cout << "Logger End" << std::endl;
    logFile.close(); }

  private:
  std::fstream logFile;

  std::string getCacheEventTypeString(const uint8_t & type) {
    switch (type)
    {
    case LOAD: return std::string("LOAD");
    case RFO: return std::string("RFO");
    case PREFETCH: return std::string("PREFETCH");
    case WRITEBACK: return std::string("WRITEBACK");
    case TRANSLATION: return std::string("TRANSLATION");
    case NUM_TYPES: return std::string("NUM_TYPES");
    default:
      return std::string("UKN");
    }
  }
};