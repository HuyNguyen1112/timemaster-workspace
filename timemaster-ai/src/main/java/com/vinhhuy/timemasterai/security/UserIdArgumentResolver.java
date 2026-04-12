package com.vinhhuy.timemasterai.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserIdArgumentResolver implements HandlerMethodArgumentResolver {

    private final JwtService jwtService;
    private final UserContext userContext;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUserId.class) 
                && parameter.getParameterType().equals(Long.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter,
                                  @Nullable ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest,
                                  @Nullable WebDataBinderFactory binderFactory) {
        
        String authHeader = webRequest.getHeader("Authorization");
        Long userId = jwtService.extractUserId(authHeader);
        
        if (userId == null) {
            log.warn("UserId extraction failed from header: {}", authHeader);
            throw new RuntimeException("Chưa đăng nhập (UserId resolution failed)");
        }

        // Populate the RequestScope bean for the duration of this HTTP request
        userContext.setUserId(userId);
        
        return userId;
    }
}
