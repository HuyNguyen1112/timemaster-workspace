package com.vinhhuy.timemaster;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TimemasterApplication {

	public static void main(String[] args) {
		SpringApplication.run(TimemasterApplication.class, args);
	}

}
