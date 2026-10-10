package com.hiremate.agent;

import java.util.Map;

/**
 * Interface cho các công cụ (Tools) mà AI Agent có thể tự động quyết định gọi.
 */
public interface AgentTool {

    String getName();

    String getDescription();

    Map<String, Object> execute(Map<String, Object> params);
}
