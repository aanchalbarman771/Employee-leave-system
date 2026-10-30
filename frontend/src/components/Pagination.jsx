import React from "react";

const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  itemLabel = "requests"
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (totalItems === 0) return null;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Generate pagination page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="pagination-footer">
      <div className="pagination-info">
        Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of{" "}
        <strong>{totalItems}</strong> {itemLabel}
        {totalPages > 1 && (
          <span style={{ marginLeft: "6px", opacity: 0.8 }}>
            (Page {currentPage} of {totalPages})
          </span>
        )}
      </div>

      <div className="pagination-controls">
        {/* Previous Button */}
        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous Page"
        >
          ◀ Prev
        </button>

        {/* Page Number Buttons */}
        {pages.map((p, index) => {
          if (p === "...") {
            return (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                •••
              </span>
            );
          }
          return (
            <button
              key={`page-${p}`}
              type="button"
              className={`pagination-btn ${currentPage === p ? "active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next Page"
        >
          Next ▶
        </button>
      </div>
    </div>
  );
};

export default Pagination;
