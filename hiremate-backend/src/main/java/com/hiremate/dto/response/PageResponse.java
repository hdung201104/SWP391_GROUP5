package com.hiremate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageResponse<T> {
    private List<T> items;
    private int page;
    private int size;
    private long totalItems;
    private int totalPages;
    private boolean isFirst;
    private boolean isLast;
    private boolean hasNext;
    private boolean hasPrevious;

    public static <T, R> PageResponse<R> of(Page<T> pageObj, List<R> mappedItems) {
        return PageResponse.<R>builder()
                .items(mappedItems)
                .page(pageObj.getNumber())
                .size(pageObj.getSize())
                .totalItems(pageObj.getTotalElements())
                .totalPages(pageObj.getTotalPages())
                .isFirst(pageObj.isFirst())
                .isLast(pageObj.isLast())
                .hasNext(pageObj.hasNext())
                .hasPrevious(pageObj.hasPrevious())
                .build();
    }
}
