package com.arcade.repository;

import com.arcade.model.BrawlbotsMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BrawlbotsMatchRepository extends JpaRepository<BrawlbotsMatch, Long> {
    List<BrawlbotsMatch> findByStatus(String status);
}
