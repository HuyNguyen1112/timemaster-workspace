package com.vinhhuy;

import dev.langchain4j.mcp.client.DefaultMcpClient;
import dev.langchain4j.mcp.client.transport.http.HttpMcpTransport;
import java.time.Duration;

public class TestMcp {
    public static void main(String[] args) {
        try {
            var transport = new HttpMcpTransport.Builder()
                .sseUrl("http://localhost:8080/sse")
                .timeout(Duration.ofSeconds(60))
                .build();
            var client = new DefaultMcpClient.Builder().transport(transport).build();
            var tools = client.listTools();
            System.out.println("---- TOOLS FOUND: " + (tools == null ? "null" : tools.size()) + " ----");
            if(tools != null) {
                for(var t : tools) {
                    System.out.println("Tool: " + t.name() + " - " + t.description());
                }
            }
            client.close();
            System.exit(0);
        } catch(Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
}
