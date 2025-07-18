import { useState } from "react";

const Tickets = () => {
  const [ticketsData] = useState([
    {
      id: "TKT-001",
      description: "Claim processing delay",
      creationDate: "2025-04-10",
      status: "Open",
    },
    {
      id: "TKT-002",
      description: "Coverage dispute",
      creationDate: "2025-04-09",
      status: "In Progress",
    },
    {
      id: "TKT-003",
      description: "Premium adjustment request",
      creationDate: "2025-04-08",
      status: "Closed",
    },
    {
      id: "TKT-004",
      description: "Policy renewal issue",
      creationDate: "2025-04-07",
      status: "Open",
    },
    {
      id: "TKT-005",
      description: "Missing documentation",
      creationDate: "2025-04-06",
      status: "In Progress",
    },
    {
      id: "TKT-006",
      description: "Incorrect billing amount",
      creationDate: "2025-04-05",
      status: "Closed",
    },
    {
      id: "TKT-007",
      description: "System access problem",
      creationDate: "2025-04-04",
      status: "Open",
    },
  ]);

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case "Open":
        return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300`;
      case "In Progress":
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300`;
      case "Closed":
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300`;
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Tickets
        </h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          New Ticket
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="text-gray-700 dark:text-gray-300 text-left py-3 px-4">Ticket ID</th>
              <th className="text-gray-700 dark:text-gray-300 text-left py-3 px-4">Description</th>
              <th className="text-gray-700 dark:text-gray-300 text-left py-3 px-4">Creation Date</th>
              <th className="text-gray-700 dark:text-gray-300 text-left py-3 px-4">Status</th>
              <th className="text-gray-700 dark:text-gray-300 text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            {ticketsData.map((ticket) => (
              <tr key={ticket.id} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="text-gray-900 dark:text-gray-100 py-3 px-4 font-medium">
                  {ticket.id}
                </td>
                <td className="text-gray-900 dark:text-gray-100 py-3 px-4">
                  {ticket.description}
                </td>
                <td className="text-gray-900 dark:text-gray-100 py-3 px-4">
                  {ticket.creationDate}
                </td>
                <td className="py-3 px-4">
                  <span className={getStatusBadge(ticket.status)}>
                    {ticket.status}
                  </span>
                </td>
                <td className="text-gray-900 dark:text-gray-100 py-3 px-4">
                  <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                    View
                  </button>
                  <button className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 mr-3">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tickets; 